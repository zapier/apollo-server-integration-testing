import { ApolloServer, gql, UserInputError } from 'apollo-server-express';

interface Book {
  title: string;
  author: string;
}

export const database: {
  books: Book[];
} = {
  books: [],
};

const typeDefs = gql`
  type Query {
    books(first: Int, skip: Int): [Book!]!
  }
  type Book {
    title: String!
    author: String!
  }
  type Mutation {
    createBook(title: String!, author: String!): Book!
  }
`;

const resolvers = {
  Query: {
    books: (
      parent: null,
      {
        first = 10,
        skip = 0,
      }: {
        first?: number;
        skip?: number;
      }
    ) => {
      if (first < 0) {
        throw new UserInputError('`first` must be a positive integer');
      }

      return database.books.slice(skip, skip + first);
    },
  },
  Mutation: {
    createBook(parent: null, { title, author }: Book) {
      database.books.push({ title, author });
      return database.books[database.books.length - 1];
    },
  },
};

export const apolloServer = new ApolloServer({ typeDefs, resolvers });
