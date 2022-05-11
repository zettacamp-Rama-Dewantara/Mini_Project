const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    name : String,
    email : String,
    hashed_password : String,
    user_type : {
        type : String,
        enum : ['Admin', 'Creator', 'Enjoyer'],
        default: 'Enjoyer'
    }
})

module.exports = mongoose.model('User',userSchema)