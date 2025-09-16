const mongoose = require('mongoose')

const connectDb = async () => {
    const uri = process.env.MONGODB_URI
    if (!uri) {
        console.error('Missing MONGODB_URI environment variable')
        process.exit(1)
    }
    try {
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
        })
        console.log('Database is connected')
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error?.message || error)
        process.exit(1)
    }
}

module.exports = connectDb