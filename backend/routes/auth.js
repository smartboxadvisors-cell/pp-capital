const express = require('express');
const router = express.Router();

// Login endpoint
router.post('/login', (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Check if environment variables are set
        if (!process.env.EMAIL || !process.env.PASSWORD) {
            console.error('Environment variables EMAIL and PASSWORD are not set');
            return res.status(500).json({
                success: false,
                message: 'Server configuration error'
            });
        }
        
        // Check credentials (case-insensitive email comparison)
        if (email.toLowerCase() === process.env.EMAIL.toLowerCase() && password === process.env.PASSWORD) {
            res.json({
                success: true,
                token: 'authenticated',
                message: 'Login successful'
            });
        } else {
            res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router;