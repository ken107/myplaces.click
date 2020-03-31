import { Router } from 'express';
import session from 'express-session';
import { readFileSync } from 'fs';
import grant from 'grant-express';
import log4js from 'log4js';
import path from 'path';

import fileLocateHandler from '../handlers/file-locate-handler';
import responseUtilsHandler from '../handlers/response-utils-handler';
import credentialRoute from './credential-route';
import createFileUploadRoute from './file-upload-route';
import userRoutes from './users-route';

export default function apiRoute() {
    const route = Router();

    route.use(responseUtilsHandler);
    route.use(fileLocateHandler());

    let oauthCfg: object;
    try {
        oauthCfg = JSON.parse(readFileSync('./oauth.json').toString());
        if (!oauthCfg || typeof oauthCfg !== 'object' || Array.isArray(oauthCfg)) {
            throw new Error('oauth.json is invalid');
        }
    } catch (e) {
        log4js.getLogger().error(JSON.stringify({
            message: 'Failed to read oauth.json',
            stack: e.stack,
        }));
        oauthCfg = {};
    }

    route.use('/grant', session({ secret: 'grant', saveUninitialized: true, resave: true }), (req, res, next) => {
        let { redirectUrl } = req.query;

        if (!redirectUrl && req.session.grant) {
            const { dynamic } = req.session.grant;
            redirectUrl = dynamic && dynamic['redirectUrl'];
        }

        const cfg = Object.entries(oauthCfg).reduce((prev, [key, val]) => ({
            ...prev, [key]: {
                ...val, callback: redirectUrl ||
                    path.posix.normalize(`${process.env.API_BASE_PATH}/credential/oauth/${val['callback'] || key}`),
            },
        }), {});

        grant({
            ...cfg,
            defaults: {
                protocol: 'http',
                host: `localhost:${process.env.PORT}`,
                transport: 'querystring',
                path: process.env.API_BASE_PATH + '/grant',
            },
        })(req, res, next);
    });

    route.use('/users', userRoutes);
    route.use('/credential', credentialRoute());

    route.use('/utils/files/upload', createFileUploadRoute());

    return route;
}
