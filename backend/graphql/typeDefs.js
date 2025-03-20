const gql = require('graphql-tag');

module.exports = gql`

  scalar Upload

  type User {
    id: ID!
    firstName: String!
    lastName: String!
    gender: String!
    phoneNumber: String!
    email: String!
    role: String!
    createdAt: String!
    profilePicture: String
    resetPasswordToken: String
    resetPasswordExpires: String
  }

  input CreateUserInput {
    firstName: String!
    lastName: String!
    gender: String!
    phoneNumber: String!
    email: String!
    password: String!
    confirmPassword: String!
    profilePicture: String
    role: String!
  }

  input UpdateUserInput {
    firstName: String
    lastName: String
    phoneNumber: String
  }


  type Property {
    id: ID!
    title: String!
    description: String!
    price: Float!
    location: String!
    bedrooms: Int!
    bathrooms: Int!
    propertyType: String!
    squareFeet: Int!
    furnished: Boolean!
    hasParking: Boolean!
    features: [String]
    realtor: User!
    images: [String]
    archived: Boolean!      # Newly added field
    createdAt: String!
  }

  input PropertyFilterInput {
    propertyType: String
    minPrice: Float
    maxPrice: Float
    bedrooms: Int
    bathrooms: Int
    location: String
    dateListed: String
    sort: String
    realtor: ID
  }

  type AuthPayload {
    token: String!
    user: User!
  }


  input LoginInput {
    email: String!
    password: String!
  }

  input ResetPasswordInput {
    email: String!
  }

  type Query {
    getUsers: [User!]!
    getUserById(id: ID!): User
    getBookings(realtorId: ID): [Booking]
    getAllProperties(filter: PropertyFilterInput): [Property]
    getUniqueLocations: [String]
    getPropertyById(id: ID!): Property
  }
    
  input ResetPasswordWithTokenInput {
    token: String!
    password: String!
  }

  type ResetPasswordResponse {
    success: Boolean!
    message: String!
    redirectTo: String!
  }
  
  type Booking {
    id: ID!
    date: String!
    startTime: String!
    endTime: String!
    mode: String!
    status: String!
    zoomLink: String
    officeAddress: String
    notes: String
    client: User!
    realtor: User!
    property: Property!
  }

  input BookingInput {
    date: String!
    startTime: String!
    endTime: String!
    mode: String!
    notes: String
    status: String!
  }

  type Mutation {
    createUser(input: CreateUserInput!, profilePicture: Upload): User!
    login(email: String!, password: String!): AuthPayload!
    updateUser(id: ID!, input: UpdateUserInput!, profilePicture: Upload): User!
    deleteUser(id: ID!): Boolean
    resetPassword(input: ResetPasswordInput!): User!
    resetPasswordWithToken(input: ResetPasswordWithTokenInput!): ResetPasswordResponse!
    createBooking(input: BookingInput!): Booking
    confirmBooking(id: ID!): Booking

    addProperty(
      title: String!
      description: String!
      price: Float!
      location: String!
      bedrooms: Int!
      bathrooms: Int!
      propertyType: String!
      squareFeet: Int!
      furnished: Boolean
      hasParking: Boolean
      features: [String]
      realtor: ID!
      images: [Upload]
    ): Property

    updateProperty(
      id: ID!
      title: String
      description: String
      price: Float
      location: String
      bedrooms: Int
      bathrooms: Int
      propertyType: String
      squareFeet: Int
      furnished: Boolean
      hasParking: Boolean
      features: [String]
      images: [Upload]
    ): Property

    deleteProperty(id: ID!): String
  }
`;
