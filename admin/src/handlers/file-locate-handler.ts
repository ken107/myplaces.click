import { Express, RequestHandler } from 'express';
import fs from 'fs';
import fsExtra from 'fs-extra';
import path from 'path';

import { DBFile } from '../models/db-file';

declare global {
    namespace Express {
        export interface Request {
            locateFile(fileName: string | DBFile): Promise<DBFile>;
        }
    }
}

export default function fileLocateHandler(): RequestHandler {
    return (req, res, next) => {
        req.locateFile = async (fileName) => {
            let file = fileName instanceof DBFile ? fileName
                : typeof fileName === 'string' && await DBFile.query().findOne('fileName', fileName);

            if (file && file.tempPath) {
                let targetDir = path.join(process.env.UPLOAD_DIR || '.', file.fileName);

                if (!path.isAbsolute(targetDir)) {
                    targetDir = path.resolve(targetDir);
                }

                const createTargetName = (name: string) => [name, file.fileExtension].filter(f => !!f).join('.');

                const targetFileName = createTargetName('original');
                const targetFullName = path.join(targetDir, targetFileName);

                fsExtra.ensureDirSync(targetDir);
                try {
                    fsExtra.moveSync(file.tempPath, targetFullName);
                } catch (e) {
                    if (!fs.existsSync(file.tempPath)) {
                        await DBFile.query().deleteById(file.id);
                    }

                    throw e;
                }

                file = await DBFile.query().patchAndFetchById(file.id, { tempPath: null });
            }

            return file;
        };

        next();
    };
}
