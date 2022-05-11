const Playlist = require('../models/Playlist')
const _ = require('lodash')

const getAllPlaylist = async (parent,{pagination,fillter,sorting},context) => {

    const query = {
        $and : [{}]
    }

    const aggregateQuery = [{ $match :query }]

    if(fillter) {
        if(fillter.playlist_name) {
            query.$and.push({playlist_name: {$regex: fillter.playlist_name, $options:'i'}})
        }
        if(fillter.song_name) {
            aggregateQuery.push(
                {
                    $lookup:
                    {
                        from: "songs",
                        localField: "song_id",
                        foreignField: "_id",
                        as: "songs_lookup"
                    }
                },
                {
                    $match : { 'songs_lookup.name' : {$regex: fillter.song_name, $options: 'i'}}
                }
            )
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
                {
                    $match : { 'users_lookup.name' : {$regex: fillter.creator_name, $options: 'i'}}
                }
            )
        }
    }

    if(sorting) {
        let sort = {}
        if(sorting.playlist_name) {
            sort.playlist_name = sorting.playlist_name === 'asc' ? 1 : -1
        }
        if(sorting.creator_name) {
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
            sort.user_name_lower = sorting.creator_name === 'asc' ? 1 : -1
        }

        aggregateQuery.push({
            $sort : _.isEmpty(sort) ? {createdAt: -1} : sort
        })
    }

    const playlist = await Playlist.aggregate(aggregateQuery)
    return playlist
}

const getPlaylistById = async (parent,{id},context) => {
    const playlist = await Playlist.findById(id)
    return playlist
}

const createPlaylist = async (parent,{input_playlist},context) => {
    const currentUser = context.currentUser

    if(!currentUser) {
        throw new AuthenticationError("not authenticated")
    }

    const playlist = new Playlist({
        playlist_name: input_playlist.playlist_name,
        created_by: currentUser._id
    })

    await playlist.save()
    return playlist
}

const addSongPlaylist = async (parent,{input_playlist,id},context) => {
    const currentUser = context.currentUser
    const playlist = await Playlist.findById({_id: id})
    console.log(playlist)

    if(!currentUser) {
        throw new AuthenticationError("not authenticated")
    }

    playlist.song_id = playlist.song_id.concat(input_playlist.song_id)

    if(currentUser._id.toString() === playlist.collaborator_id.toString() || currentUser._id.toString() === playlist.created_by.toString()) {
        await playlist.save()
        return playlist
    }
    throw new Error('only creaator or collaborator can add song to playlist')
    
}

const addCollaboratorPlylist = async (parent,{input_playlist,id},context) => {
    const currentUser = context.currentUser
    const playlist = await Playlist.findById({_id: id})
    console.log(playlist.created_by)

    if(!currentUser) {
        throw new AuthenticationError("not authenticated")
    }

    playlist.collaborator_id = playlist.collaborator_id.concat(input_playlist.collaborator_id)
   
    if(currentUser._id.toString() === playlist.created_by.toString()) {
        await playlist.save()
        return playlist
    }

    throw new Error('only playlist creator can add collaborator')
}

const removeSongPlaylist = async (parent,{input_playlist,id},context) => {
    const currentUser = context.currentUser
    const playlist = await Playlist.findById({_id:id.id})

    if(!currentUser) {
        throw new AuthenticationError("not authenticated")
    }

    playlist.song_id = playlist.song_id.pull(input_playlist.song_id)

    if(currentUser._id.toString() === playlist.collaborator_id.toString() || currentUser._id.toString() === playlist.created_by.toString()){
        await playlist.save()
        return playlist
    }
    throw new Error('only creaator or collaborator can remove song from playlist')
}

const removeCollaboratorPlaylist = async (parent,{input_playlist,id},context) => {
    const currentUser = context.currentUser
    const playlist = await Playlist.findById(id)

    if(!currentUser) {
        throw new AuthenticationError("not authenticated")
    }

    playlist.collaborator_id = playlist.collaborator_id.pull(input_playlist.collaborator_id)

    if(currentUser._id.toString() === playlist.created_by.toString()){
        await playlist.save()
        return playlist
    }
    throw new Error('only playlist creator can remove collaborator')
}

const loadUser = async (parent,args,context) => {
    if(parent.created_by) {
        return await context.loaders.UserLoader.load(parent.created_by)
    }
}

const loadCollaborator = async (parent,args,context) => {
    if(parent.collaborator_id) {
        return await context.loaders.UserLoader.loadMany(parent.collaborator_id)
    }
}

const loadSong =  async (parent,args,context) => {
    if(parent.song_id) {
        return await context.loaders.SongLoader.loadMany(parent.song_id)
    }
}

module.exports = {
    Query : {
        getAllPlaylist,
        getPlaylistById
    },
    Mutation: {
        createPlaylist,
        addSongPlaylist,
        addCollaboratorPlylist,
        removeSongPlaylist,
        removeCollaboratorPlaylist
    },
    Playlist : {
        created_by : loadUser,
        collaborator_id : loadCollaborator,
        song_id : loadSong
    }
}