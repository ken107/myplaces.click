import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';

import dbInitHandler from './handlers/db-init-handler';
import errorHandler from './handlers/error-handler';
import apiRoute from './routes';
import filesRoute from './routes/files-route';

export async function startServer(opts?: { knexConfig?: object, port?: number }) {
    const { knexConfig, port: cfgPort } = typeof opts === 'object' && opts || ({} as any);

    const port = cfgPort || +process.env.PORT;
    const app = express();

    if (process.env.CORS) {
        app.use(cors({ origin: process.env.CORS }));
    }

    app.use(process.env.API_BASE_PATH, bodyParser.json(), dbInitHandler(knexConfig), apiRoute());
    app.use('/files', dbInitHandler(knexConfig), filesRoute);

    app.use(errorHandler());

    app.listen(port, () => console.log(`Magic happen on http://localhost:${port}/`));
}
