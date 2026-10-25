# Spec Delta

## Purpose

Defines how the client keeps its OAuth access token fresh in the background without crashing, leaking timers or keeping short-lived processes alive.

## ADDED Requirements

### Requirement: Single automatic refresh per client
When automatic refresh is enabled, a client SHALL have at most one pending automatic refresh at any time. Every successful login or refresh SHALL replace a pending refresh instead of adding another one.

#### Scenario: Repeated logins
- **WHEN** a client logs in three times in a row
- **THEN** exactly one automatic refresh is pending

#### Scenario: Refresh reschedules
- **WHEN** an automatic refresh succeeds
- **THEN** exactly one new automatic refresh is pending

### Requirement: Failed refresh does not crash the process
A failing automatic refresh MUST NOT cause an unhandled promise rejection or terminate the process. The client SHALL keep its previous tokens, SHALL NOT schedule a further automatic refresh after a failure, and SHALL notify an optional refresh-error callback with the error.

#### Scenario: Refresh rejected by the server
- **WHEN** the scheduled refresh request fails
- **THEN** the process keeps running, the refresh-error callback (if registered) receives the error, and no further automatic refresh is pending

#### Scenario: Callback missing
- **WHEN** no refresh-error callback is registered and the refresh fails
- **THEN** the failure is silently ignored and later API calls report an expired token as before

### Requirement: Automatic refresh can be stopped
The client SHALL provide a way to cancel the pending automatic refresh. After stopping, no automatic refresh SHALL run until the next login or manual refresh.

#### Scenario: Dispose
- **WHEN** the caller disposes the client
- **THEN** no automatic refresh is pending

### Requirement: Pending refresh does not keep the process alive
A pending automatic refresh MUST NOT by itself prevent the Node.js process from exiting.

#### Scenario: CLI exit
- **WHEN** the CLI user selects "Exit" after logging in
- **THEN** the process terminates immediately
