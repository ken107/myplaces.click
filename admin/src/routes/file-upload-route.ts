import { Router } from 'express';
import fileUpload, { Options as FileUploadOptions, UploadedFile } from 'express-fileupload';
import os from 'os';
import path from 'path';
import shortid from 'shortid';

import authHandler from '../handlers/auth-handler';
import { DBFile } from '../models/db-file';

export default function createFileUploadRoute(opts?: FileUploadOptions) {
    const route = Router();

    route.use(authHandler(true));
    route.use(fileUpload({
        useTempFiles: true,
        tempFileDir: (tmpDir => path.normalize((path.isAbsolute(tmpDir)
            ? tmpDir : path.join(os.tmpdir(), tmpDir)) + path.sep))
            (process.env.UPLOAD_TEMP_DIR || require('../../package.json')['name']),
        ...(opts || {}),
    }));

    route.post('/', async (req, res, next) => {
        const { file }: Record<string, UploadedFile> = req.files as any;
        const { user } = req.authInfo || {};

        const uploaderUserId = user && user.id || null;

        let { typeId: fileType } = req.query;
        fileType = isNaN(fileType) ? null : +fileType;

        const { name: fileTitle, mimetype: fileMime, tempFilePath: tempPath } = file;
        const nameSplit = fileTitle.split('.');
        const fileExtension = nameSplit.length > 1 && nameSplit.pop().toLowerCase() || '';

        try {
            let fileName: string;

            do {
                fileName = `file-${shortid.generate()}.${fileExtension}`;
            } while (await DBFile.query().findOne('fileName', fileName));

            const fileData = {
                ...await DBFile.query().insertAndFetch({
                    uploaderUserId,
                    fileName, fileTitle, fileType,
                    fileExtension, fileMime, tempPath,
                }),
            };

            delete fileData['uploaderUserId'];
            delete fileData['tempPath'];

            await res.appJson(fileData);
        } catch (e) {
            next(e);
        }
    });

    return route;
}
