const mongoose = require('mongoose')
const mongodb = 'mongodb+srv://ekegrant59:M1Uh1XZFtitD75nl@book-rentals.r2jlzqe.mongodb.net/book-rental'
mongoose.connect(mongodb)

const book_listing_schema = new mongoose.Schema({
    title:{
        type: String,
        required: true
    },
    author:{
        type: String,
        required: true
    },
    category:{
        type: String,
        required: true
    },
    ISBN:{
        type: String
    },
    img:{
        type: String
    },
    status:{
        type: String,
        enum: ['Available', 'Out of Stock']
    },
    rentedBy:{
        type: String
    }
})

module.exports = mongoose.model('book_listing', book_listing_schema)