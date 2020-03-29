import mysql from "mysql";
interface DbConfig {
    host: string;
    user: string;
    pass: string;
    charset: string;
    timezone: string;
}
declare class DbConnection {
    pool: mysql.Pool;
    constructor(dbName: string, dbConfig: DbConfig);
    execute(sql: string, values: any): Promise<any>;
    shutdown(): Promise<unknown>;
}
export declare function getConnection(dbName: string): DbConnection;
export declare function shutdown(): void;
export {};
