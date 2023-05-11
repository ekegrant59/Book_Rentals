const mongoose = require('mongoose')
const mongodb = 'mongodb+srv://ekegrant59:M1Uh1XZFtitD75nl@book-rentals.r2jlzqe.mongodb.net/book-rental'
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