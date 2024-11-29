import Task from '../model/task.model.js';
import expressAsyncHandler from 'express-async-handler';
const asyncHandler = expressAsyncHandler;

// Create new task
const createTask = asyncHandler(async (req, res) => {
    const { description, endDate, duration } = req.body;
    const task = new Task({
        description,
        endDate,
        duration,
        progress: 0,
        status: 'pending',
        owner: req.user.id,
        dateCreated: new Date()
    });

    console.log(task);

    const savedTask = await task.save();
    res.status(201).json(savedTask);
});

// Get all tasks for logged in user
const getTasks = asyncHandler(async (req, res) => {
    const tasks = await Task.find({ owner: req.user.id });
    res.json(tasks);
});

// Get single task
const getTask = asyncHandler(async (req, res) => {
    const task = await Task.findOne({ 
        _id: req.params.id,
        user: req.user.id 
    });

    if (!task) {
        return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
});

// Update task
const updateTask = asyncHandler(async (req, res) => {
    // First, find the task and verify ownership
    const task = await Task.findById(req.params.id);
    
    if (!task) {
        res.status(404);
        throw new Error('Task not found');
    }

    // Verify task ownership
    if (task.owner.toString() !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to update this task');
    }

    // Update the task
    const updatedTask = await Task.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
    );

    res.json(updatedTask);
});

// Delete task
const deleteTask = asyncHandler(async (req, res) => {
    const task = await Task.findOneAndDelete({ 
        _id: req.params.id,
        owner: req.user.id 
    });

    if (!task) {
        return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
});

export {
    createTask,
    getTasks,
    getTask, 
    updateTask,
    deleteTask
};
