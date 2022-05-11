const { gql } = require('apollo-server-express')

const playlistTypeDef = gql`
    type Playlist {
        _id: ID
        playlist_name: String
        created_by: User
        song_id: [Song]
        collaborator_id: [User]
    }

    input InputPlaylist {
        playlist_name: String
        song_id: ID
        collaborator_id: ID
    }

    input InputPlaylistFilter {
        playlist_name: String,
        song_name: String,
        creator_name: String
    }

    input InputPlaylistSorting {
        playlist_name: sortingPlaylistEnum,
        creator_name: sortingPlaylistEnum
    }

    enum sortingPlaylistEnum {
        asc
        desc
    }

    extend type Query {
        getAllPlaylist(fillter: InputPlaylistFilter, sorting: InputPlaylistSorting):[Playlist]
        getPlaylistById(id:ID): Playlist
    }

    extend type Mutation {
        createPlaylist(input_playlist: InputPlaylist): Playlist,
        addSongPlaylist(id: ID,input_playlist: InputPlaylist): Playlist
        addCollaboratorPlylist(id: ID,input_playlist: InputPlaylist): Playlist
        removeSongPlaylist(id: ID,input_playlist: InputPlaylist): Playlist
        removeCollaboratorPlaylist(id: ID,input_playlist: InputPlaylist): Playlist
    }
`

module.exports = playlistTypeDef