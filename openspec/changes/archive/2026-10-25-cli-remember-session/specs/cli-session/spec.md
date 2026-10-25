# Spec Delta

## Purpose

Lets the CLI remember a successful login across runs by keeping the OAuth refresh token, so repeated debugging sessions do not require re-entering credentials or running the full OAuth login.

## ADDED Requirements

### Requirement: Opt-in to remember a login
After a successful login with username and password, the CLI SHALL ask whether the login should be remembered. Only if the user accepts SHALL it store the refresh token, username, app version and platform in a session file in the user's configuration directory. The password MUST NOT be stored.

#### Scenario: User accepts
- **WHEN** the password login succeeds and the user answers yes
- **THEN** a session file exists containing refresh token, username, app version and platform, and no password

#### Scenario: User declines
- **WHEN** the password login succeeds and the user answers no
- **THEN** no session file is written

### Requirement: Session file is private
The session file SHALL be readable and writable only by the owning user, and its location SHALL follow the platform's per-user configuration directory (honoring `XDG_CONFIG_HOME` when set).

#### Scenario: Permissions on creation
- **WHEN** the CLI writes the session file on macOS or Linux
- **THEN** the file mode is `0600`

### Requirement: Reuse a saved session
When a session file exists at start, the CLI SHALL show the saved username, app version and platform and offer to continue with it. When the user accepts, the CLI SHALL log in with the saved refresh token and the saved app version and platform, without asking for version, platform, username or password.

#### Scenario: Valid session
- **WHEN** a valid session exists and the user chooses to use it
- **THEN** the login succeeds without credential prompts and the command menu is shown

#### Scenario: User wants a fresh login
- **WHEN** a session exists and the user chooses not to use it
- **THEN** the normal prompts are shown and the session file is left unchanged until a new login is remembered

### Requirement: Rotated tokens are persisted
While a session is remembered, the CLI SHALL update the session file whenever the client receives a new refresh token, including manual and automatic token refreshes.

#### Scenario: Manual refresh
- **WHEN** the user runs "Refresh token" in a remembered session
- **THEN** the session file contains the new refresh token afterwards

#### Scenario: Next start after a refresh
- **WHEN** the CLI is started again after a token refresh in the previous run
- **THEN** the saved session still logs in successfully

### Requirement: Invalid sessions fall back to the prompts
If logging in with a saved session fails, the CLI SHALL print a short explanation, delete the session file and continue with the normal prompts. It MUST NOT exit with an unhandled error.

#### Scenario: Expired refresh token
- **WHEN** the saved refresh token is rejected
- **THEN** the CLI prints that the saved login is no longer valid, removes the file and asks for version, platform, username and password

#### Scenario: Corrupt session file
- **WHEN** the session file cannot be parsed
- **THEN** the CLI treats it like an invalid session

### Requirement: Forget a saved login
The CLI SHALL offer a menu command that deletes the session file.

#### Scenario: Forget
- **WHEN** the user selects "Forget saved login"
- **THEN** the session file is deleted and the next start shows the normal prompts

### Requirement: Readable login errors
A failed password login SHALL print the error message (including the service error code when available) and exit with a non-zero exit code, without an unhandled exception stack trace.

#### Scenario: Rejected app version
- **WHEN** the password login fails with an app-version-rejected error
- **THEN** the CLI prints the message naming version and platform and exits with code 1

### Requirement: Library notifies about token changes
The client library SHALL let callers register a callback that is invoked with the current access and refresh token whenever they change (password login, refresh-token login, manual or automatic refresh). Callers that do not register a callback MUST see unchanged behavior.

#### Scenario: Callback after refresh
- **WHEN** a callback is registered and the token is refreshed
- **THEN** the callback is called once with the new tokens
