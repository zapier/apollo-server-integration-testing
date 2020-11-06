// @flow

import { convertNodeHttpToRequest, runHttpQuery } from 'apollo-server-core';
import { ApolloServer } from 'apollo-server-express';
import express from 'express';
import { DocumentNode, ExecutionResult, print } from 'graphql';
import httpMocks, { RequestOptions, ResponseOptions } from 'node-mocks-http';

const mockRequest = (options: RequestOptions = {}) =>
  httpMocks.createRequest({
    method: 'POST',
    ...options,
  });

const mockResponse = (options: ResponseOptions = {}) =>
  httpMocks.createResponse(options);

export type StringOrAst = string | DocumentNode;
export type Options<T extends object> = { variables?: T };

export type TestClientConfig = {
  // The ApolloServer instance that will be used for handling the queries you run in your tests.
  // Must be an instance of the ApolloServer class from `apollo-server-express` (or a compatible subclass).
  apolloServer: ApolloServer;
  // Extends the mocked Request object with additional keys.
  // Useful when your apolloServer `context` option is a callback that operates on the passed in `req` key,
  // and you want to inject data into that `req` object.
  // If you don't pass anything here, we provide a default request mock object for you.
  // See https://github.com/howardabrams/node-mocks-http#createrequest for all the default values that are included.
  extendMockRequest?: RequestOptions;
  // Extends the mocked Response object with additional keys.
  // Useful when your apolloServer `context` option is a callback that operates on the passed in `res` key,
  // and you want to inject data into that `res` object (such as `res.locals`).
  // If you don't pass anything here, we provide a default response mock object for you.
  // See https://www.npmjs.com/package/node-mocks-http#createresponse for all the default values that are included.
  extendMockResponse?: ResponseOptions;
};

export type TestQuery = <T extends object = {}, V extends object = {}>(
  operation: StringOrAst,
  { variables }?: Options<V>
) => Promise<ExecutionResult<T>>;

export type TestSetOptions = (options: {
  request?: RequestOptions;
  response?: ResponseOptions;
}) => void;

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
export function createTestClient({
  apolloServer,
  extendMockRequest = {},
  extendMockResponse = {},
}: TestClientConfig) {
  const app = express();
  apolloServer.applyMiddleware({ app });

  let mockRequestOptions = extendMockRequest;
  let mockResponseOptions = extendMockResponse;

  /**
   * Set the options after TestClient creation
   * Useful when you don't want to create a new instance just for a specific change in the request or response.
   *  */

  const setOptions: TestSetOptions = ({
    request,
    response,
  }: {
    request?: RequestOptions;
    response?: ResponseOptions;
  }) => {
    if (request) {
      mockRequestOptions = request;
    }
    if (response) {
      mockResponseOptions = response;
    }
  };

  const test: TestQuery = async <T extends object = {}, V extends object = {}>(
    operation: StringOrAst,
    { variables }: Options<V> = {}
  ) => {
    const req = mockRequest(mockRequestOptions);
    const res = mockResponse(mockResponseOptions);

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
        variables,
      },
      request: convertNodeHttpToRequest(req),
    });

    return JSON.parse(graphqlResponse) as T;
  };

  return {
    query: test,
    mutate: test,
    setOptions,
  };
}
