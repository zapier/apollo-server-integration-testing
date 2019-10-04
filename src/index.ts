// @flow

import express from 'express';
import httpMocks from 'node-mocks-http';
import { print } from 'graphql';
import { convertNodeHttpToRequest, runHttpQuery } from 'apollo-server-core';

import { ApolloServer } from 'apollo-server-express';
import { DocumentNode } from 'graphql';

const mockRequest = (options = {}) =>
  httpMocks.createRequest({
    method: 'POST',
    ...options
  });

const mockResponse = (options = {}) => httpMocks.createResponse(options);

type StringOrAst = string | DocumentNode;
type Options = { variables?: object};

type TestClientConfig = {
  // The ApolloServer instance that will be used for handling the queries you run in your tests.
  // Must be an instance of the ApolloServer class from `apollo-server-express` (or a compatible subclass).
  apolloServer: ApolloServer;
  // Extends the mocked Request object with additional keys.
  // Useful when your apolloServer `context` option is a callback that operates on the passed in `req` key,
  // and you want to inject data into that `req` object.
  // If you don't pass anything here, we provide a default request mock object for you.
  // See https://github.com/howardabrams/node-mocks-http#createrequest for all the default values that are included.
  extendMockRequest?: {};
  // Extends the mocked Response object with additional keys.
  // Useful when your apolloServer `context` option is a callback that operates on the passed in `res` key,
  // and you want to inject data into that `res` object (such as `res.locals`).
  // If you don't pass anything here, we provide a default response mock object for you.
  // See https://www.npmjs.com/package/node-mocks-http#createresponse for all the default values that are included.
  extendMockResponse?: {};
};

// This function takes in an apollo server instance and returns a function that you can use to run operations
// against your schema, and assert on the results.
//
// Example usage:
// ```
// const apolloServer = await createApolloServer({ schema })
// const query = createTestClient({
//   apolloServer,
// });
//
// const result = await query(
//   `{ currentUser { id } }`
// )
//
// expect(result).toEqual({
//   data: {
//     currentUser: {
//       id: '1'
//     }
//   }
// });
// ```
export const createTestClient = ({
  apolloServer,
  extendMockRequest = {},
  extendMockResponse = {}
}: TestClientConfig) => {
  const app = express();
  apolloServer.applyMiddleware({ app });

  const test = async (operation: StringOrAst, {variables}: Options = {}) => {
    const req = mockRequest(extendMockRequest);
    const res = mockResponse(extendMockResponse);

    const graphQLOptions = await apolloServer.createGraphQLServerOptions(
      req,
      res
    );

    const { graphqlResponse } = await runHttpQuery([req, res], {
      method: 'POST',
      options: graphQLOptions,
      query: {
        // operation can be a string or an AST, but `runHttpQuery` only accepts a string
        query: typeof operation === 'string' ? operation : print(operation),
        variables
      },
      request: convertNodeHttpToRequest(req)
    });

    return JSON.parse(graphqlResponse);
  };

  return {
    query: test,
    mutate: test
  };
};
