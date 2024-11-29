import express from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import { createTask, getTasks, getTask, updateTask, deleteTask } from '../controller/task.controller.js';

const task = express.Router();

// Protect all routes
task.use(authMiddleware);

// Task routes
task.post('/', createTask);
task.get('/', getTasks);
task.get('/:id', getTask);
task.put('/:id', updateTask);
task.delete('/:id', deleteTask);

export default task;


