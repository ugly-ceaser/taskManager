import Authrouter from './authentication.route.js';
import UserRoute from './user.route.js';
import task from './task.route.js';
import express from 'express';

const routes = express.Router();

routes.use('/auth', Authrouter);
routes.use('/users', UserRoute);
routes.use('/tasks', task);

export default routes;    
