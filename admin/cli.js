#!/usr/bin/env node

require('dotenv').config();

require('covid-admin').startServer({
    knexConfig: require('./knexfile.js'),
});
