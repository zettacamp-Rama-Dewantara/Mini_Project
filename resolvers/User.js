const User = require('../models/User')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const _ = require('lodash')
const {ApolloError, AuthenticationError} = require('apollo-server-errors')

const getAllUser = async (parent,{pagination,fillter,sorting},context) => {
    const query = {
        $and : [{}]
    }

    const aggregateQuery = [{ $match :query }]

    if(fillter) {
        if(fillter.name) {
            query.$and.push({name: {$regex: fillter.name, $options:'i'}})
        }
        if(fillter.user_type) {
            query.$and.push({user_type: fillter.user_type})
        }
    }

    if(sorting) {
        let sort = {}
        sort.name = sorting.name === 'asc' ? 1 : -1
        aggregateQuery.push({
            $sort : _.isEmpty(sort) ? {createdAt: -1} : sort
        })
    }

    if (pagination && (pagination.page || pagination.page === 0) && pagination.limit ) {
        aggregateQuery.push({
          $facet: {
            data: [
              { $skip: pagination.limit * pagination.page },
              { $limit: pagination.limit },
            ],
            countData: [{ $group: { _id: null, count: { $sum: 1 } } }],
          },
        });
    
        let users = await User.aggregate(aggregateQuery);
        const count_document =
          users[0] && users[0].countData[0] && users[0].countData[0].count
            ? users[0].countData[0].count
            : 0;
        return users[0].data.map((data) => {
          return { ...data, count_document };
        });
    }

    // if (pagination && (pagination.page || pagination.page === 0) && pagination.limit) {
    //     aggregateQuery.push(
    //          { $skip : pagination.page > 0 
    //             ? ( ( pagination.page - 1 ) * pagination.limit )
    //             : 0 }, { $limit: pagination.limit },
    //     );
    // }
    const user = await User.aggregate(aggregateQuery)
    return user
}

const getOneUser = async (parent,args) => {
    const user = await User.findById({_id: args._id})
    return user
}

const loginUser = async (parent, {loginInput}) => {
    const user = await User.findOne({email: loginInput.email})

    const passworCorrect = user === null
        ? false
        : await bcrypt.compare(loginInput.hashed_password, user.hashed_password)

    if(!(user && passworCorrect)) {
        throw new ApolloError('wrong password or email')
    }

    const userForToken = {
        email: user.email,
        user_id: user._id
    }

    // const token = jwt.sign(userForToken,"SECRET")
    // user.token = token
    // return user

    return { value: jwt.sign(userForToken, 'SECRET') }
}

const createUser = async (parent,{input_user}) => {
    const foundEmail = await User.findOne({email : input_user.email})

    if(foundEmail) {
        throw new UserInputError('email alredy exisit', {
            invalidArgs: input_user.email
        })
    }

    var encrypedPassword = await bcrypt.hash(input_user.hashed_password, 10)

    const user = new User({
        name: input_user.name,
        email: input_user.email,
        hashed_password: encrypedPassword,
        user_type: input_user.user_type
    })
    console.log(user.hashed_password)

    await user.save()
    return user
}

const updateUser = async (parent,{input_user},context) => {
    const currentUser = context.currentUser

    var encrypedPassword = await bcrypt.hash(input_user.hashed_password, 10)
    
    const user = {
        name: input_user.name,
        email: input_user.email,
        hashed_password: encrypedPassword
    }

    const savedUser = await User.findByIdAndUpdate({_id: currentUser._id},user,{new: true})
    return savedUser
}

module.exports = {
    Query: {
        getAllUser,
        getOneUser,
        me: (parent,args,context) => {
            return context.currentUser
        }
    },
    Mutation: {
        loginUser,
        updateUser,
        createUser
    }
}