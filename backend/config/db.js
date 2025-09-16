const mongoose = require('mongoose')

const connectDb = async () => {
    try {
        const connect = await mongoose.connect('mongodb+srv://shivam:shivam@cluster0.02nbsmp.mongodb.net/mutualfunds?retryWrites=true&w=majority&appName=Cluster0')
        console.log('Database is connected')
    } catch (error) {
        console.log(err)
        process.exit(1)
    }
}

module.exports = connectDb