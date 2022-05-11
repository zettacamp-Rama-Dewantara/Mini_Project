const mongoose = require('mongoose')

const playlistSchema = new mongoose.Schema({
    playlist_name: String,
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref : 'User'
    },
    song_id:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Song'
        }
    ],
    collaborator_id: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref : 'User'
        }
    ]
})

module.exports = mongoose.model('Playlist', playlistSchema)