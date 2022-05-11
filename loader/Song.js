const DataLoader = require('dataloader')
const Song = require('../models/Song')

const batchSong = async (songsId) => {
    const songs = await Song.find({_id : {$in : songsId}})

    const dataMap = new Map()
    songs.forEach((song) => {
        dataMap.set(song._id.toString(), song)
    })

    return songsId.map((id) => dataMap.get(id.toString()))
}

exports.SongLoader = () => new DataLoader(batchSong);