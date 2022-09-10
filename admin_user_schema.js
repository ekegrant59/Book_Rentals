const mongoose = require('mongoose')
const mongodb = 'mongodb://localhost:27017/book_rental'
mongoose.connect(mongodb)

const admin_user_schema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    encryptedPassword: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['admin', 'member'],
        required: true
    }
})

module.exports = mongoose.model('admin_user', admin_user_schema)