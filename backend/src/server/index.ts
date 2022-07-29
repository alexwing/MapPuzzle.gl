import 'dotenv/config';

import compression from 'compression';
import cors from 'cors';
import express from 'express';
import passport from 'passport';
import bodyParser from 'body-parser';

import routes from '../routes/route';
import { connect } from './database';

// Instantiate express
const server = express();
server.use(compression());
server.use(bodyParser.json({limit: '50mb'}));

// Passport Config
server.use(passport.initialize());

// Connect to sqlite
if (process.env.NODE_ENV !== 'test') {
  connect();
}

server.use(cors());
server.use(express.json());

// Initialize routes middleware
server.use('/api/', routes);

export default server;
