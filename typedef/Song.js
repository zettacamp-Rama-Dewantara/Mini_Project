const { gql } = require('apollo-server-express');

const songTypeDef = gql`
    type Song {
        _id: ID,
        name: String,
        genre: String,
        duration: Int
        created_by: User
        count_document: Int
    }

    input InputSong {
        name: String,
        genre: String,
        duration: Int
    }

    input InputSongPage {
        page: Int
        limit: Int
    }

    input InputSongFilter {
        name: String,
        genre: String,
        creator_name: String
    }

    input InputSongSorting {
        name: sortingSongEnum
        genre: sortingSongEnum,
        created_by: sortingSongEnum
    }

    enum sortingSongEnum {
        asc
        desc
    }

    extend type Query {
        getAllSong(pagination: InputSongPage, fillter: InputSongFilter, sorting: InputSongSorting): [Song]
        getSongById(id: ID): Song
    }

    extend type Mutation {
        createSong(input_song: InputSong): Song
        updateSong(id: ID,input_song: InputSong) : Song
        removeSong(id:ID): Song
    }
`

module.exports = songTypeDef