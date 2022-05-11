const mongoose = require('mongoose')

const songSchema = new mongoose.Schema({
    name:String,
    genre:String,
    duration:Number,
    created_by: {
        type : mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
})

module.exports = mongoose.model('Song', songSchema)