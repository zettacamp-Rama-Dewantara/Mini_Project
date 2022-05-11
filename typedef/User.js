const { gql } = require('apollo-server-express');

const userTypeDef = gql`
  type User {
        _id : ID,
        name : String
        email : String
        # hashed_password : String,
        user_type : userEnum,
        # token: String
    }

    type Token {
        value: String
    }

    input InputUser {
        name : String
        email : String
        hashed_password: String
        user_type : userEnum
    }

    input InputPage {
        page : Int
        limit: Int
    }

    input InputFilter {
        name: String,
        user_type: userEnum
    }

    input InputSorting {
        name : sortingEnum
    }

    input LoginInput {
        email: String,
        hashed_password: String
    }

    enum userEnum {
        Admin
        Creator
        Enjoyer
    }

    enum sortingEnum {
        asc
        desc
    }

    extend type Query {
        getAllUser(pagination: InputPage, fillter: InputFilter, sorting: InputSorting): [User]
        getOneUser(_id:ID): User
        me: User
    }

    extend type Mutation {
        createUser(
            input_user: InputUser
        ) : User,
        loginUser(loginInput: LoginInput): Token
        updateUser(input_user: InputUser): User
    }
`

module.exports = userTypeDef