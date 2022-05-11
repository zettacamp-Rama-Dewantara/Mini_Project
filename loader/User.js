const DataLoader = require('dataloader')
const User = require('../models/User')

const batchUsers = async (usersId) => {
    const users = await User.find({_id : {$in : usersId}})

    const dataMap = new Map()
    users.forEach((user) => {
        dataMap.set(user._id.toString(), user)
    })

    return usersId.map((id) => dataMap.get(id.toString()))
}

exports.UserLoader = () => new DataLoader(batchUsers);