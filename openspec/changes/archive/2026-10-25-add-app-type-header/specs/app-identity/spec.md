# Spec Delta

## Purpose

Defines how the client tells the Comfort Cloud API which app version and platform it acts as, and how a rejected app identity is reported to callers.

## ADDED Requirements

### Requirement: Selectable app platform
The client SHALL let callers choose the app platform (iOS or Android) when it is created and SHALL send the matching platform identifier (`X-APP-TYPE`: `0` for iOS, `1` for Android) together with the app version on every request to the Comfort Cloud API.

#### Scenario: iOS platform selected
- **WHEN** a client is created with version 5.1.1 and platform iOS
- **THEN** every API request carries `X-APP-VERSION: 5.1.1` and `X-APP-TYPE: 0`

#### Scenario: Android platform selected
- **WHEN** a client is created with version 5.1.0 and platform Android
- **THEN** every API request carries `X-APP-VERSION: 5.1.0` and `X-APP-TYPE: 1`

### Requirement: Backward-compatible defaults
When no platform is given the client SHALL use Android; when no version is given it SHALL use its built-in default version. Existing callers that pass only a version MUST keep the previous behavior.

#### Scenario: Only a version is passed
- **WHEN** a client is created with only a version
- **THEN** requests carry that version and `X-APP-TYPE: 1`

#### Scenario: Nothing is passed
- **WHEN** a client is created without arguments
- **THEN** requests carry the built-in default version and `X-APP-TYPE: 1`

### Requirement: Effective identity is readable
The client SHALL expose the app version and platform it uses, read-only, so callers can log them.

#### Scenario: Reading the identity
- **WHEN** a caller reads the version and platform of a client created with (5.1.1, iOS)
- **THEN** it gets 5.1.1 and iOS

### Requirement: Rejected app identity is reported distinctly
When the API rejects the request with error code 4106, the client SHALL throw an error that callers can recognize as "app version rejected", that includes the version and platform that were sent, and that is still recognizable as a general service error.

#### Scenario: Login rejected with 4106
- **WHEN** the login is answered with `401` and code 4106
- **THEN** the thrown error is an app-version-rejected error, is also a service error with code 4106, and its message names the sent version and platform

#### Scenario: Other service errors unchanged
- **WHEN** the API answers with any other error code (e.g. 4100 token expired)
- **THEN** the client throws the same error types as before

### Requirement: Current built-in default version
The built-in default version SHALL be a version currently accepted by the API for the Android platform at release time.

#### Scenario: Default accepted at release
- **WHEN** the release is prepared
- **THEN** a request with the default version and Android platform is not rejected with 4106
