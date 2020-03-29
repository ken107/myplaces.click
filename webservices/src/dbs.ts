import assert from "assert";
import mysql from "mysql";
import config from "./config";


interface DbConfig {
  host: string;
  user: string;
  pass: string;
  charset: string;
  timezone: string;
}

class DbConnection {
  pool: mysql.Pool;
  constructor(dbName: string, dbConfig: DbConfig) {
    assert(dbName && dbConfig);
    this.pool = mysql.createPool({
      connectionLimit: 10,
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.pass,
      charset: dbConfig.charset,
      timezone: dbConfig.timezone,
      database: dbName,
      typeCast: function(field, next) {
        if (/^is[A-Z]/.test(field.name) && /^(TINY|SHORT|INT24|LONG|LONGLONG)$/.test(field.type)) return !/^0+$/.test(field.string());
        return next();
      }
    })
  }
  execute(sql: string, values: any): Promise<any> {
    assert(sql);
    return new Promise((fulfill, reject) => this.pool.query(sql, values, (err, result) => err ? reject(err) : fulfill(result)));
  }
  shutdown() {
    return new Promise((fulfill, reject) => this.pool.end(err => err ? reject(err) : fulfill()));
  }
}


const connections: {[key: string]: DbConnection} = {};

export function getConnection(dbName: string) {
  return connections[dbName] || (connections[dbName] = new DbConnection(dbName, config.db));
}

export function shutdown() {
  Object.values(connections).forEach(con => con.shutdown());
}
