import 'dotenv/config';

import compression from 'compression';
import cors from 'cors';
import express from 'express';
import passport from 'passport';
import bodyParser from 'body-parser';
import fileUpload from 'express-fileupload';

import routes from '../routes/route';
import mapCreator from '../routes/mapCreator';
import mapEditor from '../routes/mapEditor';
import wikiImport from '../routes/wikiImport';
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
server.use(fileUpload());
server.use(cors());
server.use(express.json());

// Initialize routes middleware
server.use('/api/', routes);
server.use('/api/mapCreator', mapCreator);
server.use('/api/mapEditor', mapEditor);
server.use('/api/wikiImport', wikiImport);

// backend route for edit puzzles



export default server;
