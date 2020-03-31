import contentDisposition from 'content-disposition';
import { Response, Router } from 'express';
import fs from 'fs';
import Jimp from 'jimp';
import path from 'path';

import { DBFile } from '../models/db-file';

function maxSizeScaler(minRate: number, bound: number) {
    return (jimp: Jimp) => {
        const rate = Math.min(minRate,
            bound / jimp.getWidth(),
            bound / jimp.getHeight());
        return jimp.scale(rate);
    };
}

const DEFINED_SIZE: Record<string, (jimp: Jimp) => Jimp> = {
    qhd: maxSizeScaler(1, 1440),
    fhd: maxSizeScaler(1, 1080),
    hd: maxSizeScaler(1, 720),
    large: maxSizeScaler(.8, 720),
    medium: maxSizeScaler(.5, 480),
    small: maxSizeScaler(.3, 360),
    xl: maxSizeScaler(1, 1200),
    lg: maxSizeScaler(1, 992),
    md: maxSizeScaler(1, 768),
    sm: maxSizeScaler(1, 576),
    thumb: maxSizeScaler(1, 72),
};

const scaleTaskMap: Record<string, Record<string, Promise<void>>> = {};

function sendFile(res: Response, filePath: string) {
    return new Promise((resolve, reject) => res.sendFile(filePath, err => {
        if (err) {
            reject(err);
        } else {
            resolve();
        }
    }));
}

const filesRoute = Router();

filesRoute.get('/:fileType/:imageSize?/:fileName', async (req, res, next) => {
    const { fileName, fileType } = req.params;
    let { imageSize } = req.params;
    let fileRecord = await DBFile.query().findOne('fileName', fileName);

    if (!fileRecord || (fileType === 'tmp' && !fileRecord.tempPath)) {
        res.sendStatus(404);
        return;
    }

    res.setHeader('Content-Type', fileRecord.fileMime);
    res.setHeader('Content-Disposition', contentDisposition(fileRecord.fileTitle, { type: 'inline' }));

    try {
        if (fileType === 'tmp') {
            await sendFile(res, fileRecord.tempPath);
        } else {
            if (fileRecord.tempPath) {
                fileRecord = await req.locateFile(fileRecord);
            }

            let fileDir = path.join(process.env.UPLOAD_DIR || '.', fileRecord.fileName);

            if (!path.isAbsolute(fileDir)) {
                fileDir = path.resolve(fileDir);
            }

            const getPath = (inputPath: string) => path.join(fileDir,
                [inputPath, fileRecord.fileExtension].filter(p => !!p).join('.'));

            const orgImagePath = getPath('original');

            if (imageSize && fileRecord.fileMime.toLowerCase().startsWith('image/')) {
                imageSize = imageSize.toLowerCase();
                const convertFn = DEFINED_SIZE[imageSize];

                if (!convertFn) {
                    res.status(400);
                    throw new Error('ImageSize is invalid');
                }

                let fileTasks = scaleTaskMap[fileName];

                if (!fileTasks) {
                    fileTasks = scaleTaskMap[fileName] = {};
                }

                let scaleTask = fileTasks[imageSize];
                const scaleImagePath = getPath(imageSize);

                if (!scaleTask) {
                    scaleTask = fileTasks[imageSize] = (async () => {
                        if (!fs.existsSync(scaleImagePath)) {
                            const jimp = await Jimp.read(orgImagePath);
                            await convertFn(jimp).writeAsync(scaleImagePath);
                        }
                    })();
                }

                try {
                    await scaleTask;
                    await sendFile(res, scaleImagePath);
                } catch (e) {
                    delete fileTasks[imageSize];
                    throw e;
                }
            } else {
                await sendFile(res, orgImagePath);
            }
        }
    } catch (e) {
        res.removeHeader('Content-Type');
        res.removeHeader('Content-Disposition');

        if (e instanceof Error && e['statusCode'] === 404) {
            res.sendStatus(404);
        } else {
            next(e);
        }
    }
});

export default filesRoute;
