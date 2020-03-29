"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const mysql_1 = __importDefault(require("mysql"));
const config_1 = __importDefault(require("./config"));
class DbConnection {
    constructor(dbName, dbConfig) {
        assert_1.default(dbName && dbConfig);
        this.pool = mysql_1.default.createPool({
            connectionLimit: 10,
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.pass,
            charset: dbConfig.charset,
            timezone: dbConfig.timezone,
            database: dbName,
            typeCast: function (field, next) {
                if (/^is[A-Z]/.test(field.name) && /^(TINY|SHORT|INT24|LONG|LONGLONG)$/.test(field.type))
                    return !/^0+$/.test(field.string());
                return next();
            }
        });
    }
    execute(sql, values) {
        assert_1.default(sql);
        return new Promise((fulfill, reject) => this.pool.query(sql, values, (err, result) => err ? reject(err) : fulfill(result)));
    }
    shutdown() {
        return new Promise((fulfill, reject) => this.pool.end(err => err ? reject(err) : fulfill()));
    }
}
const connections = {};
function getConnection(dbName) {
    return connections[dbName] || (connections[dbName] = new DbConnection(dbName, config_1.default.db));
}
exports.getConnection = getConnection;
function shutdown() {
    Object.values(connections).forEach(con => con.shutdown());
}
exports.shutdown = shutdown;
