// Update with your config settings.

module.exports = {

    development: {
      client: 'mysql2',
      connection: {
        "host": "localhost",
        "user": "webservices",
        "password": "YOUR_PASSWORD",
        "database": "YOUR_DATABASE_NAME",
        "pool": {
          "refreshIdle": false,
          "reapIntervalMillis": 0,
          "min": 5,
          "max": 10
        }
      },
      // debug:'DEBUG=knex:tx',
    },
  };