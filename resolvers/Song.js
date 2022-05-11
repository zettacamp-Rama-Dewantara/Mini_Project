const Song = require('../models/Song')
const _ = require('lodash')

const createSong = async (parent,{input_song},context) => {
    const currentUser = context.currentUser

    if(!currentUser) {
        throw new AuthenticationError('not authenticated')
    }

    const song = new Song({
        name: input_song.name,
        genre: input_song.genre,
        duration: input_song.duration,
        created_by: currentUser._id
    })

    if(currentUser.user_type === 'Admin') {
        await song.save()
        return song
    }
    throw new Error('Only Admin can create song')
}

const updateSong = async (parent,{input_song,id},context) => {
    const currentUser = context.currentUser
    const song = await Song.findById({_id: id})

    if(!currentUser) {
        throw new AuthenticationError("not authenticated")
    }

    song.name= input_song.name
    song.genre = input_song.genre
    song.duration = input_song.duration

    if(currentUser._id.toString() === song.created_by.toString()){
        await song.save()
        return song
    }

    throw new Error('only user created this song can update')
}

const getAllSong = async (parent,{pagination,fillter,sorting},context) => {
    const currentUser = context.currentUser

    if(!currentUser) {
        throw new AuthenticationError("not authenticated")
    } 
    const query = {
        $and : [{}]
    }

    const aggregateQuery = [{ $match :query }]

    if(fillter) {
        if(fillter.name) {
            query.$and.push({name: {$regex: fillter.name, $options:'i'}})
        }
        if(fillter.genre) {
            query.$and.push({genre: {$regex: fillter.genre, $options: 'i'}})
        }
        if(fillter.creator_name) {
            aggregateQuery.push(
                {
                    $lookup:
                    {
                        from: "users",
                        localField: "created_by",
                        foreignField: "_id",
                        as: "users_lookup"
                    }
                },
                // {
                //     $unwind : '$users_lookup'
                // },
                {
                    $match : { 'users_lookup.name' : {$regex: fillter.creator_name, $options: 'i'}}
                }
            )
        }
    }

    if(sorting) {
        let sort = {}
        if(sorting.name) {
            sort.name = sorting.name === 'asc' ? 1 : -1
        }
        if(sorting.genre) {
            sort.genre = sorting.genre === 'asc' ? 1 : -1
        }
        
        if(sorting.created_by) {
            aggregateQuery.push(
                {
                    $lookup:
                    {
                        from: "users",
                        localField: "created_by",
                        foreignField: "_id",
                        as: "users_lookup"
                    }
                },
                { 
                    $set : {
                        user_name_lower: { $toLower: { $arrayElemAt: ['$users_lookup.name',0] } }
                    }
                }
            )
            sort.user_name_lower = sorting.created_by === 'asc' ? 1 : -1
        }

        aggregateQuery.push({
            $sort : _.isEmpty(sort) ? {createdAt: -1} : sort
        })
    }

    if (pagination && (pagination.page || pagination.page === 0) && pagination.limit) {
        aggregateQuery.push(
             { $skip : pagination.page > 0 
                ? ( ( pagination.page - 1 ) * pagination.limit )
                : 0 }, { $limit: pagination.limit },
        );
    }

    const songs = await Song.aggregate(aggregateQuery)
    return songs
}

const getSongById = async (parent,args,context) => {
    const currentUser = context.currentUser

    if(!currentUser) {
        throw new AuthenticationError("not authenticated")
    }
    
    const song = await Song.findById(args.id)
    return song
}

const removeSong = async (parent,args,context) => {
    const currentUser = context.currentUser
    const song = await Song.findById({_id: args.id})

    if(!currentUser) {
        throw new AuthenticationError("not authenticated")
    }

    if(currentUser._id.toString() === song.created_by.toString()) {
        await Song.findByIdAndDelete({_id: args.id})
        throw new Error('data deleted')
    }
    throw new Error('only user create this song can delete')
}

const loadUser = async (parent,args,context) => {
    if(parent.created_by) {
        return await context.loaders.UserLoader.load(parent.created_by)
    }
}

module.exports = {
    Query: {
        getAllSong,
        getSongById
    },
    Mutation: {
        createSong,
        updateSong,
        removeSong
    },
    Song : {
        created_by : loadUser
    }
}