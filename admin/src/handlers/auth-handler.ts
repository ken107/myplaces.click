import { Express, Request, RequestHandler } from 'express';
import jwt from 'jwt-simple';
import { raw } from 'objection';

import { DBRole, DBUser, DBUserSession } from '../models/user-role';

interface JWTData {
    id: number;
    time: number;
    sessionId: string;
}

declare global {
    namespace Express {
        export interface AuthInfo {
            user: DBUser;
            session: DBUserSession;
            roles: string[];
            time: number;
            jwtData: JWTData;
            isExpired(): boolean;
            isInRole(...roles: string[]): boolean;
        }
    }
}

let sessionDuration: number;
export function getSessionExpired(date: Date) {
    if (sessionDuration === void 0) {
        sessionDuration = +process.env.SESSION_DURATION;
    }

    if (sessionDuration > 0) {
        return new Date(date.getTime() + sessionDuration * 1000);
    }
}

export function decodeJWT(req: Request): JWTData {
    const [, token] = /^JWT (.+)$/i.exec(req.headers.authorization) || [];

    if (token) {
        return jwt.decode(token, process.env.JWT_SECRET);
    }
}

export default function authHandler(allowAnonymous: boolean): RequestHandler;
export default function authHandler(...roles: string[]): RequestHandler;
export default function authHandler(roleOrAnonymous?: boolean | string, ...roles: string[]): RequestHandler {
    let requireAuth = true;

    if (typeof roleOrAnonymous === 'string') {
        roles.unshift(roleOrAnonymous);
    } else {
        requireAuth = roleOrAnonymous !== true;
    }

    return async (req, res, next) => {
        try {
            let session: DBUserSession;
            const currentTime = new Date();

            if (!req.authInfo) {
                const jwtData = decodeJWT(req);

                if (requireAuth && !jwtData) {
                    res.status(400);
                    next(new Error('Token is not provided or invalid.'));
                    return;
                }

                const { id, time, sessionId } = jwtData;

                const user: Partial<DBUser> = await DBUser.query().joinEager('roles').findById(+id);

                if (requireAuth && !user) {
                    res.status(401);
                    next(new Error('User not found'));
                    return;
                }

                const authRoles = ((user || { roles: [] }).roles as DBRole[]).map(r => r.name);

                session = await DBUserSession.query()
                    .findOne({ userId: user.id, sessionId });

                req.authInfo = {
                    user: user as DBUser, time, roles: authRoles, jwtData, session,
                    isInRole(...inputRoles: string[]) {
                        return authRoles.some(name => inputRoles.includes(name));
                    },
                    isExpired() {
                        if (!session) {
                            const endTime = getSessionExpired(new Date(time));
                            return !!endTime && currentTime > endTime;
                        }

                        if (session.invalidated && currentTime > session.invalidated) {
                            return true;
                        }

                        const expire = getSessionExpired(session.lastAccess || session.created);
                        return currentTime > expire;
                    },
                };
            }

            if (requireAuth && roles.length) {
                if (req.authInfo.roles.every(role => !roles.includes(role))) {
                    res.status(403);
                    next(new Error(`User doesn't have permission.`));
                    return;
                }
            }

            if (session) {
                const expired = requireAuth && req.authInfo.isExpired();

                if (requireAuth) {
                    req.authInfo.session = await session.$query().patchAndFetch({
                        [expired ? 'invalidated' : 'lastAccess']: raw('?', currentTime),
                    });
                }

                if (expired) {
                    res.status(401);
                    next(new Error('Session is expired.'));
                    return;
                }
            }

            next();
        } catch (e) {
            if (requireAuth) {
                res.status(500);
                next(e);
            } else {
                next();
            }
        }
    };
}
