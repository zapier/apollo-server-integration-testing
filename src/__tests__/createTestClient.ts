import { database, apolloServer, Book } from '../__mocks__/apolloServer';
import { createTestClient } from '../';

describe('createTestClient', () => {
  const GET_BOOKS = `query GetBooks($first: Int, $skip: Int) {
    books(first: $first, skip: $skip) {
      title
      author
    }
  }`;
  const CREATE_BOOK = `mutation CreateBook($title: String!, $author: String!) {
    createBook(title: $title, author: $author) {
      title
      author
    }
  }`;

  beforeEach(() => {
    database.books = [
      {
        title: 'The Awakening',
        author: 'Kate Chopin',
      },
      {
        title: 'City of Glass',
        author: 'Paul Auster',
      },
    ];
  });

  it('should call a query without variables', async () => {
    const { query } = createTestClient({
      apolloServer,
    });
    const response = await query(GET_BOOKS);

    expect(response).toEqual({ data: { books: database.books } });
  });

  it('should call a query with variables', async () => {
    const { query } = createTestClient({
      apolloServer,
    });
    const response = await query(GET_BOOKS, {
      variables: {
        first: 1,
      },
    });

    expect(response).toEqual({ data: { books: database.books.slice(0, 1) } });
  });

  it('should error when calling a query', async () => {
    const { query } = createTestClient({
      apolloServer,
    });
    const response = await query(GET_BOOKS, {
      variables: {
        first: -1,
      },
    });

    expect(response).toEqual({
      data: null,
      errors: [
        expect.objectContaining({
          message: '`first` must be a positive integer',
        }),
      ],
    });
  });

  it('should call a mutation', async () => {
    const { mutate } = createTestClient({
      apolloServer,
    });
    const book = {
      title: 'The Lord of the Rings',
      author: 'J.R. Tolkien',
    };
    const response = await mutate(CREATE_BOOK, {
      variables: book,
    });

    expect(response).toEqual({ data: { createBook: book } });
  });

  it('should typecheck', async () => {
    const { query } = createTestClient({
      apolloServer,
    });
    const { data } = await query<{ books: Book[] }>(GET_BOOKS);

    expect(data!.books).toEqual(database.books);
  });
});
