const mongoose = require('mongoose')
const mongodb = 'mongodb://localhost:27017/book_rental'
mongoose.connect(mongodb)

const renter_schema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },

    username:{
        type: String,
        required: true
    },

    password:{
        type: String,
        required: true
    }
})

module.exports = mongoose.model('renter', renter_schema)