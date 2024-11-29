// 1. Required Dependencies
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Configure dotenv
dotenv.config();

// ES Modules requires __dirname to be defined manually
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Group related environment variables
const { 
    PORT = 5000, 
    MONGODB_URI, 
    JWT_SECRET, 
    NODE_ENV 
} = process.env;

import routes from './route/index.js';

const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.static('public'));

const authenticateUser = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.redirect('/');
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.redirect('/');
    }
};


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/user', authenticateUser, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/user', 'index.html'));
});

app.get('/create-task', authenticateUser, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/user', 'create-task.html'));
});

app.get('/edit-task', authenticateUser, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/user', 'edit-task.html'));
});


app.use('/api', routes);


app.get('*', (req, res) => {
    console.log('Route not found:', req.path);
    res.redirect('/');
});


app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});


mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
