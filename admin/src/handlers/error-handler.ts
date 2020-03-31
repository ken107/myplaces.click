import { ErrorRequestHandler } from 'express';
import log4js from 'log4js';
import path from 'path';

log4js.configure({
    appenders: {
        errorFile: {
            type: 'file',
            compress: true,
            maxLogSize: 2 * 1024 * 1024, // 2 MB
            filename: path.join(process.env.ERROR_LOG || './logs', 'error.log'),
        },
    },
    categories: {
        default: { appenders: ['errorFile'], level: 'all' },
        'db-initializer': { appenders: ['errorFile'], level: 'all' },
    },
});

export default function errorHandler(): ErrorRequestHandler {
    return (err, req, res, next) => {
        try {
            const errObj = {
                date: new Date(), url: req.originalUrl, err,
            };

            const errEx = typeof err === 'object' && err;

            let { message } = errEx
                || { message: typeof err === 'string' && err };
            message = message || 'Unhandled error.';

            if (res.statusCode === 200) {
                if (errEx && !isNaN(errEx['statusCode'])) {
                    res.statusCode = +errEx['statusCode'];
                } else {
                    res.status(500);
                }
            }

            if (![400, 401, 403, 404].includes(res.statusCode)) {
                console.error({
                    remote: req.connection.remoteAddress,
                    date: errObj.date,
                    url: errObj.url,
                    message,
                });

                log4js.getLogger().error(JSON.stringify({
                    remote: req.connection.remoteAddress,
                    url: errObj.url, message,
                    stack: (err instanceof Error && err.stack || '').split(/\r?\n/),
                }, null, 2));
            }

            res.json({
                status: 'fail',
                error: message,
            });
        } catch (e) {
            next(e);
        }
    };
}
