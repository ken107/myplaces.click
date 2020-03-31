#!/usr/bin/env node
import dotEnv from 'dotenv';

import args from './args';
import { startServer } from './server';

dotEnv.config({
    path: args.env,
});
startServer();
