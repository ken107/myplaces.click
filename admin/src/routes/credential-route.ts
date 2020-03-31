import bcrypt from 'bcryptjs';
import { Request, Router } from 'express';
import jwt from 'jwt-simple';
import { raw } from 'objection';
import shortid from 'shortid';

import authHandler, { getSessionExpired } from '../handlers/auth-handler';
import requestDBHandler from '../handlers/request-db-handler';
import { DBUser, DBUserSession } from '../models/user-role';
import axios from 'axios';

export default function credentialRoute() {
    const route = Router();

    async function createSession(req: Request, user: DBUser, created: Date = new Date()) {

        let sessionId: string;

        while (true) {
            sessionId = shortid.generate();

            const existedSession = await DBUserSession.query()
                .findOne({ userId: user.id, sessionId, invalidated: null });

            if (!existedSession) {
                break;
            }

            const existedExpire = getSessionExpired(existedSession.lastAccess || existedSession.created);

            if (existedExpire && created > existedExpire) {
                await DBUserSession.query()
                    .patch({ invalidated: raw('?', created) });
                break;
            }
        }

        const { deviceType, deviceToken } = req.body;
        await DBUserSession.query().insert({
            userId: user.id, sessionId,
            created, deviceType, deviceToken,
            remoteAddress: (req.headers['x-forwarded-for'] as string ||
                req.connection.remoteAddress).substr(0, 128),
        });

        return {
            sessionId, created, token: 'JWT ' + jwt.encode({
                id: user.id, time: created.getTime(), sessionId,
            }, process.env.JWT_SECRET),
        };
    }

    route.post('/register', authHandler(true),
        requestDBHandler({ passwordFields: 'password' }), async (req, res, next) => {
            try {
                const postData = req.body;

                if (!req.authInfo || !req.authInfo.isInRole('ADMIN')) {
                    delete req.body.roles;
                }

                const user: DBUser = await DBUser.query().insertGraphAndFetch(postData) as any;
                delete user.password;

                const { token } = await createSession(req, user);
                res.appJson({ token, user });
            } catch (e) {
                next(e);
            }
        });

    route.get('/oauth/facebook', async (req, res, next) => {
        try {
            const { access_token } = req.query;
            const { data } = await axios.get('https://graph.facebook.com/v6.0/me', {
                params: { access_token, fields: 'first_name,last_name' },
            });

            const oauthInit = 'facebook';
            let user = await DBUser.query().findOne({
                oauthInit, identifier: data.id,
            });

            if (!user) {
                user = await DBUser.query().insertAndFetch({
                    oauthInit, identifier: data.id,
                    firstName: data.first_name, lastName: data.last_name,
                });
            }

            delete user.password;

            const { token } = await createSession(req, user);

            await res.appJson({
                user, token,
            });
        } catch (e) {
            next(e);
        }
    });

    route.post('/login', async (req, res, next) => {
        try {
            const { identifier, password } = req.body;
            const user: DBUser = await DBUser.query()
                .eager('[profile,roles(selectRoleName)]', {
                    selectRoleName(builder) {
                        return builder.select('name');
                    },
                })
                .findOne({ identifier }) as any;

            if (!user || !bcrypt.compareSync(password, user.password)) {
                return res.appError('Invalid username or password', 400)(next);
            }

            delete user.password;

            const { token } = await createSession(req, user);

            await res.appJson({
                user, token,
            });
        } catch (e) {
            next(e);
        }
    });

    route.post('/change-password', authHandler(), async (req, res, next) => {
        const { oldPassword, newPassword } = req.body;

        if (!newPassword) {
            return res.appError('New password is required.', 400)(next);
        }

        const { user } = req.authInfo;

        if (!bcrypt.compareSync(oldPassword, user.password)) {
            return res.appError('Old password is not match.', 400)(next);
        }

        await res.appJson(user.$query().patch({
            password: bcrypt.hashSync(newPassword),
        }));
    });

    route.get('/check-session', authHandler(true), async (req, res) => {
        const auth = req.authInfo;
        await res.appJson(auth && !auth.isExpired() || false);
    });

    route.delete('/session', authHandler(), async (req, res) => {
        await res.appJson(req.authInfo.session.$query().patch({
            invalidated: raw('?', new Date()),
        }));
    });

    return route;
}
