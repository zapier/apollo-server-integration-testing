# CHANGELOG

## vNext

- Updated the return type of `TestQuery` to use GraphQL's `ExecutionResult`. [PR #12](https://github.com/zapier/apollo-server-integration-testing/pull/12)

## 2.3.1

- Updated peer dependencies to include `graphql@^15.0.0`. [PR #14](https://github.com/zapier/apollo-server-integration-testing/pull/14).

## 2.3.0

- Added new `setOptions` API to allow changing request/response mocking without having to create a new test client instance. [PR #3](https://github.com/zapier/apollo-server-integration-testing/pull/3).

## 2.2.0

- Allow mocked response to be extended as well via a new optional `extendMockResponse` option to `createTestClient`. [PR #2](https://github.com/zapier/apollo-server-integration-testing/pull/2).

## 2.1.0

- Add support for passing in `variables` parameter. [PR #1](https://github.com/zapier/apollo-server-integration-testing/pull/1).

## 2.0.0

First public stable release.
