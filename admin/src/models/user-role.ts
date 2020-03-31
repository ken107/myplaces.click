import { Model, QueryBuilder } from 'objection';
import { Column, Join, Reference, Table } from 'objection-annotations';

@Table('users', {
    uniques: [['oauthInit', 'identifier']],
    indexes: [['firstName', 'lastName']],
})
export class DBUser extends Model {
    @Column('bigIncrements')
    id: number;

    @Column('string', { schema: { maxLength: 10 } })
    oauthInit: string;

    // May be null when register using OAuth
    @Column('string', { schema: { maxLength: 32 } })
    identifier: string;

    @Column('string', { schema: { maxLength: 60 } })
    password: string;

    @Column('string', { schema: { maxLength: 50 } })
    firstName: string;

    @Column('string', { schema: { maxLength: 50 } })
    lastName: string;

    @Column('string', { schema: { maxLength: 50 } })
    avatar: string;

    @Column('integer')
    status: number;

    @Join(() => DBRole, 'manyToMany', {
        modelClass: () => DBUserRole,
        from: 'userId',
        to: 'roleId',
    })
    roles: DBRole[];

    @Join(() => DBUserSession, 'hasMany', 'userId')
    sessions: QueryBuilder<DBUserSession>;
}

@Table('roles')
export class DBRole extends Model {
    @Column('bigInteger')
    id: number;

    @Column('string', { unique: true, schema: { maxLength: 32 } })
    name: string;

    @Column('string', { schema: { maxLength: 50 } })
    description: string;
}

@Table('user_roles', { uniques: [['userId', 'roleId']] })
export class DBUserRole extends Model {
    @Column('bigIncrements')
    id: number;

    @Reference(() => DBUser, { required: true })
    userId: number;

    @Reference(() => DBRole, { required: true })
    roleId: number;
}

@Table('user_sessions', {
    indexes: [
        ['userId', 'sessionId', 'invalidated', 'created'],
        ['userId', 'deviceType'],
    ],
})
export class DBUserSession extends Model {
    @Column('bigIncrements')
    id: number;

    @Reference(() => DBUser, { required: true })
    userId: number;

    @Column('string', { required: true, schema: { maxLength: 20 } })
    sessionId: string;

    @Column('datetime', { required: true })
    created: Date;

    @Column('datetime')
    lastAccess: Date;

    @Column('datetime')
    invalidated: Date;

    @Column('string', { schema: { maxLength: 20 } })
    deviceType: string;

    @Column('string', { schema: { maxLength: 50 } })
    deviceToken: string;

    @Column('string', { schema: { maxLength: 128 } })
    remoteAddress: string;
}
