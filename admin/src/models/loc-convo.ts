import { Model } from 'objection';
import { Column, Reference, Table } from 'objection-annotations';

import { DBUser } from './user-role';

@Table('loc_questions', {
    indexes: [['locationId', 'created'], { fields: 'content', type: 'fullText' }],
})
export class DBQuestion extends Model {
    @Column('bigIncrements')
    id: number;

    @Column('integer', { required: true })
    locationId: number;

    @Reference(DBUser)
    userId: number;

    @Column('string', { required: true, schema: { maxLength: 1000 } })
    content: string;

    @Column('datetime', { required: true })
    created: Date;

    @Column('integer')
    status: number;
}

@Table('loc_answers', {
    indexes: [['questionId', 'created']],
})
export class DBAnswer extends Model {
    @Column('bigIncrements')
    id: number;

    @Reference(DBQuestion, { required: true })
    questionId: number;

    @Reference(DBUser)
    userId: number;

    @Column('string', { required: true, schema: { maxLength: 1000 } })
    content: string;

    @Column('datetime', { required: true })
    created: Date;

    @Column('integer')
    status: number;
}

export enum DBVoteType {
    LIKE = 1,
    // tslint:disable-next-line:no-bitwise
    DISLIKE = 1 << 1,
}

@Table('loc_answer_votes', {
    uniques: [['answerId', 'userId']],
    indexes: [['answerId', 'voteType']],
})
export class DBAnswerVote extends Model {
    @Column('bigIncrements')
    id: number;

    @Reference(DBAnswer, { required: true })
    answerId: number;

    @Reference(DBUser, { required: true })
    userId: number;

    @Column('datetime', { required: true })
    created: Date;

    @Column('integer')
    voteType: DBVoteType;
}
