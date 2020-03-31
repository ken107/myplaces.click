import { RequestHandler } from 'express';
import Knex from 'knex';
import log4js from 'log4js';
import { buildTable } from 'objection-annotations';
import path from 'path';

import args from '../args';
import { DBFile } from '../models/db-file';
import { DBRole, DBUser, DBUserRole, DBUserSession } from '../models/user-role';

declare global {
    namespace Express {
        export interface Request {
            knex: Knex;
        }
    }
}

async function createInitializer(knexConfig: object) {
    const knexCfg = knexConfig || (() => {
        const knexPath = args.knexFile || './knexfile.js';
        return require(path.isAbsolute(knexPath) ? knexPath : path.resolve(knexPath));
    })();

    const knex = Knex(knexCfg[process.env.DB_KNEX_CFG]);
    await buildTable(knex, DBUser, DBUserSession);
    // await buildTable(knex, DBUser, DBRole, DBUserRole, DBUserSession, DBFile);

    const appRoles: Record<string, number> = (process.env.APP_ROLES || '').split(';').filter(r => !!r)
        .reduce((prev, role) => {
            const [id, name] = role.split(':').map(s => s.trim());
            return { ...prev, [name]: +id };
        }, {});

    await Promise.all(Object.entries(appRoles)
        .map(([name, id]) => DBRole.query().upsertGraph({ id, name }, { insertMissing: true })));

    const [identifier, password, ...roles] = (process.env.APP_ADMIN || '').split(':');

    if (identifier && password) {
        const hasAdmin = await DBUser.query().where('identifier', identifier).first();

        if (!hasAdmin) {
            const admin = await DBUser.query()
                .insertAndFetch({ identifier, password, firstName: 'Site', lastName: 'Admin' });
            await Promise.all(roles.filter((r, idx, self) => !!r && self.indexOf(r) === idx)
                .map(async (role) => {
                    let roleId = appRoles[role];

                    if (!roleId && !isNaN(role as any)) {
                        roleId = +role;
                    }

                    if (!roleId) {
                        return;
                    }
                    try {
                        await DBUserRole.query()
                            .insert({ userId: admin.id, roleId });
                    } catch (e) {
                        log4js.getLogger('db-seeder').error(e);
                    }
                }));
        }
    }
    console.log('Database is ready!');
    return knex;
}

let dbInitializer: ReturnType<typeof createInitializer>;

export default function dbInitHandler(knexConfig?: object): RequestHandler {

    let isNotInit = true;
    const firstInit = new Promise(async (resolve, reject) => {
        try {
            if (!dbInitializer) {
                await (dbInitializer = createInitializer(knexConfig));
            }
            resolve();
        } catch (e) {
            reject(e);
            log4js.getLogger('db-initializer').error(e);
        } finally {
            isNotInit = false;
        }
    });

    return async (req, res, next) => {
        try {
            if (isNotInit) {
                await firstInit;
            }

            if (!dbInitializer) {
                dbInitializer = createInitializer(knexConfig);
            }

            req.knex = await dbInitializer;
            next();
        } catch (e) {
            dbInitializer = null;
            next(e);
        }
    };
}
