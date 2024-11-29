import express from 'express';

import { register, login } from '../controller/auth.controller.js';


const Authrouter = express.Router();
// Register new user
Authrouter.post('/register', register);

// Login user 
Authrouter.post('/login', login);

export default Authrouter;
