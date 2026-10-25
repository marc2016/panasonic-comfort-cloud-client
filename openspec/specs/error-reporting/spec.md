# error-reporting Specification

## Purpose

Defines how failures of the Comfort Cloud API and of the Panasonic OAuth login are reported to callers, so they can be told apart and read by humans.

## Requirements

### Requirement: Authentication failures are reported distinctly
When a request to the OAuth host fails with an HTTP error response (password login, token exchange, token refresh), the client SHALL throw an authentication error that is also a service error, carries the HTTP status, and whose message contains the server's error description (or error id when no description is given).

#### Scenario: Wrong password
- **WHEN** the OAuth host rejects the username/password
- **THEN** the thrown error is an authentication error, its HTTP status is the response status, and its message contains the server's description (e.g. "Wrong email or password.")

#### Scenario: Invalid refresh token
- **WHEN** a refresh token is rejected (e.g. `403` with `error: invalid_grant`)
- **THEN** the thrown error is an authentication error whose message contains the error description and the HTTP status

### Requirement: Error messages never contain placeholders
Errors thrown by the client MUST NOT contain the text `undefined` as a stand-in for a missing server message or code. When the Comfort Cloud API answers without a numeric code, the thrown service error SHALL use the HTTP status as its message detail.

#### Scenario: Comfort Cloud error without body code
- **WHEN** a Comfort Cloud request fails with `500` and an empty body
- **THEN** a service error is thrown whose message mentions status 500 and does not contain `undefined`

### Requirement: Existing error types are kept
Comfort Cloud errors with codes 4100, 4106 and 5005 SHALL keep their existing error types.

#### Scenario: Token expired
- **WHEN** the API answers with code 4100
- **THEN** a token-expired error is thrown as before
