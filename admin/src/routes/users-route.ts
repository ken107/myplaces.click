import bcrypt from 'bcryptjs';
import { Router } from 'express';
import objectionCrud from 'objection-express-crud';

import authHandler from '../handlers/auth-handler';
import fileLocateHandler from '../handlers/file-locate-handler';
import responseUtilsHandler, { wrapResponse } from '../handlers/response-utils-handler';
import { DBUser } from '../models/user-role';

const userRoutes = Router();

userRoutes.use('/', authHandler(), objectionCrud(DBUser, {
    routes: ['list', 'detail'],
    resultWrap(result, req, extra): any {
        return wrapResponse(result, extra, item => {
            delete item['password'];
            return item;
        });
    },
}));

userRoutes.post('/add', authHandler('ADMIN'), fileLocateHandler(), responseUtilsHandler,
    async (req, res, next) => {
        const { identifier, password, firstName, lastName, avatar } = req.body;

        try {
            if (avatar) {
                await req.locateFile(avatar);
            }

            const user = await DBUser.query().insertAndFetch({
                identifier, firstName, lastName, avatar: avatar || null,
                password: bcrypt.hashSync(password),
            });

            await res.appJson(user);
        } catch (e) {
            next(e);
        }
    });

export default userRoutes;
