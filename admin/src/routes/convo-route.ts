import { Router } from 'express';
import objectionCrud from 'objection-express-crud';

import authHandler from '../handlers/auth-handler';
import { wrapResponse } from '../handlers/response-utils-handler';
import { DBAnswer, DBAnswerVote, DBQuestion, DBVoteType } from '../models/loc-convo';
import { matchAgainst } from '../utils/query';

export default function convoRoute() {
    const route = Router();

    route.use(authHandler());

    route.use('/questions', objectionCrud(DBQuestion, {
        routes: ['list', 'insert', 'detail'],
        resultWrap(result, req, extra): any {
            return wrapResponse(result, extra);
        },
        listFn(query, req) {
            const { q, locationId } = req.query;
            query.andWhere({ locationId });

            if (q) {
                query.andWhere(matchAgainst('content', q));
            }
        },
        preRoutes: {
            insert(req) {
                const { locationId, content } = req.body;
                const { user } = req.authInfo;
                req.body = {
                    locationId, content,
                    userId: user.id,
                    created: new Date(),
                };
            },
        },
    }));

    route.use('/answers', objectionCrud(DBAnswer, {
        routes: ['list', 'insert', 'detail'],
        resultWrap(result, req, extra): any {
            return wrapResponse(result, extra);
        },
        listFn(query, req) {
            const { q, questionId } = req.query;
            query.andWhere({ questionId });

            if (q) {
                query.andWhere(matchAgainst('content', q));
            }
        },
        preRoutes: {
            insert(req) {
                const { questionId, content } = req.body;
                const { user } = req.authInfo;
                req.body = {
                    questionId, content,
                    userId: user.id,
                    created: new Date(),
                };
            },
        },
    }));

    route.post('/up-vote', async (req, res, next) => {
        try {
            const { answerId } = req.body;
            const { user } = req.authInfo;

            res.appJson(await DBAnswerVote.query().insertAndFetch({
                answerId, voteType: DBVoteType.LIKE,
                userId: user.id,
                created: new Date(),
            }));
        } catch (e) {
            next(e);
        }
    });

    return route;
}
