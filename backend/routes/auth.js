const express = require('express');
const router = express.Router();

// Login endpoint
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    
    // Check credentials
    if (email === 'smartbox.advisors@gmail.com' && password === 'Params@01') {
        res.json({
            success: true,
            token: 'authenticated',
            message: 'Login successful'
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Invalid credentials'
        });
    }
});

module.exports = router;