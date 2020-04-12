# panasonic-comfort-cloud-client

[![npm version](https://img.shields.io/npm/v/panasonic-comfort-cloud-client.svg?style=flat-square)](https://www.npmjs.com/package/panasonic-comfort-cloud-client)
[![build status](https://img.shields.io/travis/marc2016/panasonic-comfort-cloud-client/master.svg?style=flat-square)](https://travis-ci.org/github/marc2016/panasonic-comfort-cloud-client)

Panasonic Comfort Cloud Client for node.js to control air conditioning systems over REST API. This libaray uses the same endpoints as the mobile app [Panasonic Comfort Cloud](https://play.google.com/store/apps/details?id=com.panasonic.ACCsmart).

## Features

- get information of the air conditioning devices
- get Groups of the devices
- set parameter of devices

## Installing

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

Login to Panasonic Comfort Cloud with username and password will return an random token. This token is stored internally in a variable and sent with every request.

### Groups and Devices

```js
import {
  Device,
  Group,
  ComfortCloudClient,
} from 'panasonic-comfort-cloud-client'

await client.login(username, password)
// List of groups representing different homes, containig a list of devices
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

## License

[MIT](LICENSE)
