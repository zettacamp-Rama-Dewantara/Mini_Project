const url = 'mongodb://127.0.0.1:27017/music'
const mongoose = require('mongoose')
const { ApolloServer } = require('apollo-server-express');
const express = require('express')
const app = express()
const jwt = require('jsonwebtoken')
const { merge } = require('lodash')
const { gql } = require('apollo-server-express')

const userTypeDef = require('./typedef/User')
const songTypeDef = require('./typedef/Song')
const playlistTypeDef = require('./typedef/Playlist')

const userResolver = require('./resolvers/User')
const songResolver = require('./resolvers/Song')
const playlistResolver = require('./resolvers/Playlist')

const User = require('./models/User')

const { UserLoader } = require('./loader/User')
const { SongLoader } = require('./loader/Song')

const typedef = gql`
    type Query
    type Mutation
`
const typeDefs = [
    typedef,
    userTypeDef,
    songTypeDef,
    playlistTypeDef
]

let resolvers = {}

resolvers = merge(
    resolvers,
    userResolver,
    songResolver,
    playlistResolver
)
const loaders = () => {
    return {
        UserLoader: UserLoader(),
        SongLoader: SongLoader()
    }
}

const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({ req }) =>{
        const auth = req ? req.headers.authorization : null
        if (auth && auth.toLowerCase().startsWith('bearer ')) { 
            const decodedToken = jwt.verify(
            auth.substring(7),'SECRET'
            )
            const currentUser = await User.findById(decodedToken.user_id)
            return { currentUser, loaders:loaders() }
        }
    }
})

mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(result => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connecting to MongoDB:', error.message)
  })

server.start().then(res => {
    server.applyMiddleware({
        app
    })

    app.listen(3000, () => {
        console.log(`App running in port 3000`);
    })
})