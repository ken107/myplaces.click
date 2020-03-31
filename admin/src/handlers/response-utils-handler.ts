import { Express, NextFunction, RequestHandler } from 'express';

interface WrapResponseOptions {
    actualPage?: number;
    actualSize?: number;
    getTotalPage?(): Promise<number>;
}

type WrapResponseItemProcessor =
    (item: any) => Promise<any> | any;

export async function wrapResponse(data: any, opts?: WrapResponseOptions,
    itemProcessor?: WrapResponseItemProcessor): Promise<{
        status: string,
        message: string,
        data: any,
        paging?: { page: number, pageSize: number, totalPage: number },
    }> {
    const resp = { status: 'success', message: '' };
    const { actualPage, actualSize, getTotalPage } = Object.assign({}, opts);

    if (Array.isArray(data)) {
        if (typeof itemProcessor === 'function') {
            data = await Promise.all(data.map(item => Promise.resolve(itemProcessor(item))));
        }

        if (typeof getTotalPage === 'function') {
            resp['paging'] = {
                page: actualPage,
                pageSize: actualSize,
                totalPage: await getTotalPage(),
            };
        }
    } else if (typeof itemProcessor === 'function') {
        data = await Promise.resolve(itemProcessor(data));
    }

    return { ...resp, data };
}

declare global {
    namespace Express {
        export interface Response<T = any> {
            appJson(data: any, opts?: WrapResponseOptions,
                itemProcessor?: WrapResponseItemProcessor): Promise<Response<T>>;
            appJson(data: any, itemProcessor: WrapResponseItemProcessor): Promise<Response<T>>;
            appError(message: string, statusCode?: number): (next: NextFunction) => void;
        }
    }
}

const responseUtilsHandler: RequestHandler = (req, res, next) => {
    res.appJson = async (data: any, optsOrProc?: WrapResponseOptions | WrapResponseItemProcessor,
        proc?: WrapResponseItemProcessor) => {
        const result = (data instanceof Promise ||
            (['object', 'function'].includes(typeof data) && typeof data['then'] === 'function'))
            ? await data : data;
        const jsonResult = await (typeof optsOrProc === 'function'
            ? wrapResponse(result, null, optsOrProc) : wrapResponse(result, optsOrProc, proc));

        return res.json(jsonResult);
    };

    res.appError = (message, statusCode) => innerNext => {
        if (statusCode) {
            res.status(statusCode);
        }

        innerNext(new Error(message));
    };

    next();
};

export default responseUtilsHandler;
