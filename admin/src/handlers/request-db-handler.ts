import bcrypt from 'bcryptjs';
import { RequestHandler } from 'express';
import { raw } from 'objection';

export interface DBConvertOptions {
    knexRawDateBody?: boolean;
    passwordFields?: string | string[];
    sanitizeFields?: string | string[];
    deletePutPatchId?: boolean;
}

function convertDateBody(obj: any) {
    if (typeof obj === 'object' && obj) {
        Object.entries(obj).forEach(([key, val]) => {
            if (val instanceof Date) {
                obj[key] = raw('?', val);
                return;
            } else if (typeof val === 'string') {
                try {
                    if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?Z)?$/.test(val)) {
                        const date = new Date(val);

                        if (!isNaN(date.getTime())) {
                            obj[key] = raw('?', date);
                            return;
                        }
                    }
                } catch {
                    // Invalid date format, nothing to do here;
                }
            }

            obj[key] = convertDateBody(val);
        });
    }

    return obj;
}

export default function requestDBHandler(opts?: DBConvertOptions): RequestHandler {
    opts = Object.assign({ knexRawDateBody: true, deletePutPatchId: true }, opts);

    return async (req, res, next) => {
        try {
            if (typeof req.body === 'object' && req.body) {
                if (opts.deletePutPatchId && ['PUT', 'PATCH'].includes(req.method.toUpperCase())) {
                    delete req.body['id'];
                }

                if (opts.knexRawDateBody) {
                    req.body = convertDateBody(req.body);
                }

                if (Array.isArray(opts.passwordFields)) {
                    await Promise.all(opts.passwordFields.map(key => (async () => {
                        req.body[key] = await bcrypt.hash(req.body[key], 10);
                    })()));

                } else if (typeof opts.passwordFields === 'string' &&
                    req.body.hasOwnProperty(opts.passwordFields)) {
                    req.body[opts.passwordFields] = bcrypt.hashSync(req.body[opts.passwordFields]);
                }

                const sanFields = Array.isArray(opts.sanitizeFields) ? opts.sanitizeFields
                    : (opts.sanitizeFields && [opts.sanitizeFields] || []);

                sanFields.forEach(field => {
                    const fieldVal = req.body[field];

                    if (typeof fieldVal === 'object' && fieldVal) {
                        if (Array.isArray(fieldVal)) {
                            req.body[field] = fieldVal.map(val => val.id);
                        } else {
                            req.body[field] = { id: fieldVal.id };
                        }
                    }
                })
            }
            next();
        } catch (e) {
            next(e);
        }
    };
}
