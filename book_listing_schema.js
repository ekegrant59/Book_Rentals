const mongoose = require('mongoose')
const mongodb = 'mongodb://localhost:27017/book_rental'
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
        type: Number
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