# cli-login-prompts Specification

## Purpose

Defines the order and default values of the CLI's login prompts so that the suggested app version always matches the selected platform.

## Requirements

### Requirement: Platform before version
The CLI SHALL ask for the app platform before the app version, and the suggested default version SHALL belong to the selected platform: for iOS the current version from the iOS App Store, for Android the library's built-in default.

#### Scenario: iOS selected
- **WHEN** the user selects iOS and the App Store lookup succeeds
- **THEN** the version prompt suggests the current App Store version and accepting it sends that version with the iOS platform

#### Scenario: Android selected
- **WHEN** the user selects Android
- **THEN** the version prompt suggests the library's default version

#### Scenario: App Store lookup fails
- **WHEN** the user selects iOS and the App Store cannot be reached
- **THEN** the CLI prints a short notice and the version prompt has no default, so a version must be entered

### Requirement: Clean exit
After "Exit" the CLI SHALL stop the client's automatic refresh and terminate.

#### Scenario: Exit after login
- **WHEN** the user selects "Exit"
- **THEN** the process ends with exit code 0 without waiting for the refresh timer
