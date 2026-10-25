# panasonic-comfort-cloud-client

[![npm version](https://img.shields.io/npm/v/panasonic-comfort-cloud-client.svg?style=flat-square)](https://www.npmjs.com/package/panasonic-comfort-cloud-client)
[![Node.js CI](https://github.com/marc2016/panasonic-comfort-cloud-client/actions/workflows/nodejs.yml/badge.svg)](https://github.com/marc2016/panasonic-comfort-cloud-client/actions/workflows/nodejs.yml)


Panasonic Comfort Cloud Client for node.js to control air conditioning systems over REST API. This library uses the same endpoints as the mobile app [Panasonic Comfort Cloud](https://play.google.com/store/apps/details?id=com.panasonic.ACCsmart).

## Features

- get information of the air conditioning devices
- get Groups of the devices
- set parameter of devices

## Installing

Requires **Node.js 22.12 or newer** (since 3.0.0). The cookie handling depends on ESM-only packages, which this CommonJS library loads via `require()`; older Node versions fail with `ERR_REQUIRE_ESM`. Node 22.12.x prints a harmless `ExperimentalWarning`, from 22.13 on it is silent. On older Node versions stay on `panasonic-comfort-cloud-client@2`.

Using npm:

```bash
$ npm install panasonic-comfort-cloud-client
```

Using yarn:

```bash
$ yarn add panasonic-comfort-cloud-client
```

## Example

### Login

```js
import { ComfortCloudClient } from 'panasonic-comfort-cloud-client'

await client.login(username, password)
```

Login to Panasonic Comfort Cloud with username and password will return a random token. This token is stored internally in a variable and sent with every request.

### App version and platform

The API only accepts the **current** app version of the platform sent in `X-APP-TYPE`. iOS and Android versions can differ (e.g. iOS 5.1.1 while Android is still 5.1.0), so pass the version together with the matching platform:

```js
import { ComfortCloudClient, AppType, AppVersionRejectedError } from 'panasonic-comfort-cloud-client'

// version from the iOS App Store -> AppType.IOS, from Google Play -> AppType.ANDROID (default)
const client = new ComfortCloudClient('5.1.1', AppType.IOS)

try {
  await client.login(username, password)
} catch (error) {
  if (error instanceof AppVersionRejectedError) {
    // code 4106 "New version app has been published"
    console.log(`Rejected: ${error.appVersion} / ${error.appType}`)
  }
}
```

Without arguments the client uses a built-in default version with `AppType.ANDROID`. The default is only a fallback and may be outdated; pass the current store version.

### Token refresh and shutdown

After login the client refreshes the OAuth token automatically about once a day. Only one refresh is pending per client, and the pending timer does not keep the Node.js process alive (`unref`), so long-running consumers need their own event-loop handles (servers, database connections, ...). A failed automatic refresh does not throw; it stops the automatic refresh and is reported through the optional `onRefreshError` callback. Later requests then fail with `TokenExpiredError`, so log in again.

```js
const client = new ComfortCloudClient('5.1.1', AppType.IOS, {
  onTokenChange: ({ refreshToken }) => saveSomewhere(refreshToken), // refresh tokens rotate
  onRefreshError: error => console.warn('Token refresh failed', error),
})

// when the client is no longer needed (e.g. adapter unload)
client.dispose()
```

### Errors

| Error | When |
| --- | --- |
| `AuthenticationError` | The Panasonic OAuth login failed (wrong credentials, invalid refresh token). `httpCode` is the HTTP status, `code` is always `-1`, the message contains the server's description. |
| `TokenExpiredError` | Comfort Cloud code 4100, log in again. |
| `AppVersionRejectedError` | Comfort Cloud code 4106, app version/platform not accepted. |
| `ServiceError` | Any other Comfort Cloud error (`code` is the Comfort Cloud code or `-1`). All errors above extend it. |

### Groups and Devices

```js
import {
  Device,
  Group,
  ComfortCloudClient,
} from 'panasonic-comfort-cloud-client'

await client.login(username, password)
// List of groups representing different homes, containing a list of devices
const groups = await client.getGroups()
// Get device by guid. Containing readable and writable properties.
const device = await comfortCloudClient.getDevice(guid)
```

### Writable properties of device

```js
import {
  Device,
  ComfortCloudClient,
  //enums for writable properties
  Power,
  AirSwingLR,
  AirSwingUD,
  FanAutoMode,
  EcoMode,
  OperationMode,
  FanSpeed,
} from 'panasonic-comfort-cloud-client'

await client.login(username, password)
const device = await comfortCloudClient.getDevice(guid)
// writable properties of device. Use the enums for the correct numbers.
device.operate = Power.On
device.operationMode = OperationMode.Auto
device.ecoMode = EcoMode.Auto
device.temperatureSet = 22
device.airSwingUD = AirSwingUD.Mid
device.airSwingLR = AirSwingLR.Mid
device.fanAutoMode = FanAutoMode.AirSwingAuto
device.fanSpeed = FanSpeed.Auto

// use parameter setter to send specific properties or use the device setter to send all parameter
await comfortCloudClient.setParameters(device.guid, device.parameters)
await comfortCloudClient.setDevice(device)
```

### History Data

```js
import {
  ComfortCloudClient,
  DataMode
} from 'panasonic-comfort-cloud-client'

// ... login ...

// Get history data for specific device (Day, Week, Month, Year)
const history = await client.getDeviceHistoryData(device.guid, new Date(), DataMode.Day)
```

## CLI

The package comes with a command line interface to control your devices or debug the API.

```bash
$ comfort-cloud-client-cli
```
or if you haven't installed it globally:
```bash
$ npx panasonic-comfort-cloud-client
```
Follow the interactive prompts to login and control your devices.

#### Remembered login

After a successful login the CLI asks whether to remember it. If you agree, the OAuth **refresh token** (never the password) is stored together with username, app version and platform in:

- `$XDG_CONFIG_HOME/panasonic-comfort-cloud-client/session.json`, or
- `~/.config/panasonic-comfort-cloud-client/session.json` (macOS/Linux), `%APPDATA%\panasonic-comfort-cloud-client\session.json` (Windows)

The file is created with owner-only permissions (`0600`). On the next start the CLI offers to reuse it and skips all prompts. Rotated refresh tokens are saved automatically. An expired or unreadable session is removed and the normal prompts are shown. Use the menu command **Forget saved login** (or delete the file) to remove it. Anyone who can read this file can access your Comfort Cloud account until the token expires.

### Usage Example

```bash
? App Version (default: 5.1.0) 5.1.1
? App platform (X-APP-TYPE) iOS
? Username myemail@example.com
? Password [hidden]
Login successful.
? Select a package manager Get groups
Found 1 groups.
? Select a group My Home
Found 2 devices.
? Select a device or print group Living Room AC
? Select command for device Living Room AC. Get history
? Select data mode Day
{
  "energyConsumptionHeating": 0,
  "energyConsumptionCooling": 2.5,
  ...
}
```

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for details on all release history.

## License

[MIT](LICENSE)
