import User from '../model/user.model.js';
import expressAsyncHandler from 'express-async-handler';
const asyncHandler = expressAsyncHandler;

// Get user profile
const getProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
});

// Update user profile
const updateProfile = asyncHandler(async (req, res) => {
    const { username, email } = req.body;

    // Check if username or email already exists
    const existingUser = await User.findOne({
        $and: [
            { _id: { $ne: req.user.id } },
            { $or: [{ email }, { username }] }
        ]
    });

    if (existingUser) {
        return res.status(400).json({
            message: 'Username or email already taken'
        });
    }

    const user = await User.findByIdAndUpdate(
        req.user.id,
        { username, email },
        { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    res.json({
        message: 'Profile updated successfully',
        user
    });
});

// Delete user account
const deleteAccount = asyncHandler(async (req, res) => {
    const user = await User.findByIdAndDelete(req.user.id);
    
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'Account deleted successfully' });
});

export {
    getProfile,
    updateProfile,
    deleteAccount
};
