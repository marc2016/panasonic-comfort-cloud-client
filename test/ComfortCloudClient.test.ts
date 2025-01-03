import { ComfortCloudClient } from '../src/ComfortCloudClient.js'
import { Group } from '../src/model/Group.js'
import { Device } from '../src/model/Device.js'
import * as auth from './auth_data.json'
import { AirSwingUD, FanSpeed, OperationMode, Power } from '../src/index.js'

const password = auth.password
const username = auth.username

const client = new ComfortCloudClient()

test('login', async () => {
  await client.login(username, password)
}, 20000)

test('refreshToken', async () => {
  const clientLogin = new ComfortCloudClient()
  await clientLogin.login(username, password)
  
  expect(clientLogin.oauthClient.token).not.toBeNull()
  expect(clientLogin.oauthClient.tokenRefresh).not.toBeNull()

  const clientRefreshToken = new ComfortCloudClient()
  await clientRefreshToken.login('', '', clientLogin.oauthClient.tokenRefresh)

  expect(clientRefreshToken.oauthClient.token).not.toBeNull()
  expect(clientRefreshToken.oauthClient.tokenRefresh).not.toBeNull()
}, 20000)

test('getGroups', async () => {
  await client.login(username, password)
  const groups = await client.getGroups()
  if (groups.length > 0) {
    const firstGroup = groups[0]
    expect(firstGroup instanceof Group).toBeTruthy
    if (firstGroup.devices.length > 0) {
      const firstDevice = firstGroup.devices[0]
      expect(firstDevice instanceof Device).toBeTruthy
    }
  }
}, 20000)

test('getDevice', async () => {
  await client.login(username, password)
  const groups = await client.getGroups()
  if (groups.length > 0) {
    const firstGroup = groups[0]
    expect(firstGroup instanceof Group).toBeTruthy
    const firstDevice = firstGroup.devices[0]
    const device = await client.getDevice(firstDevice.guid)
    expect(device?.guid).toBe(firstDevice.guid)
  }
}, 20000)

test('setDevice', async () => {
  await client.login(username, password)
  const groups = await client.getGroups()
  if (groups.length > 0) {
    const firstGroup = groups[0]
    expect(firstGroup instanceof Group).toBeTruthy
    const firstDevice = firstGroup.devices[0]
    const device = await client.getDevice(firstDevice.guid)
    expect(device?.guid).toBe(firstDevice.guid)
    if (device) {
      const currentTemp = device.temperatureSet
      const newTemp = currentTemp - 1
      device.temperatureSet = newTemp
      await client.setDevice(device)
      const newDevice = await client.getDevice(device.guid)
      expect(newDevice?.temperatureSet).toBe(newTemp)
    }
  }
},20000)

test('Device class', async () => {
  const device = new Device('', '', { 
    airSwingUD: AirSwingUD.DownMid, 
    operate: 'On'
  }, 'pretty')

  device.operationMode = OperationMode.Cool
  device.fanSpeed = 'HighMid'
  device.temperatureSet = 20

  expect(device.operate).toBe(Power.On)
  expect(device.airSwingUD).toBe(AirSwingUD.DownMid)
  expect(device.operationMode).toBe(OperationMode.Cool)
  expect(device.fanSpeed).toBe(FanSpeed.HighMid)
  expect(device.temperatureSet).toBe(20)

  const json = device.toJSON()

  expect(json).toMatchObject({
    operate: 'On',
    operationMode: 'Cool',
    fanSpeed: 'HighMid',
    airSwingUD: 'DownMid',
    temperatureSet: 20
  })

  expect(JSON.parse(JSON.stringify(device))).toMatchObject({
    operate: 'On',
    operationMode: 'Cool',
    fanSpeed: 'HighMid',
    airSwingUD: 'DownMid',
    temperatureSet: 20
  })

  const secondDevice = new Device('', '', device, 'pretty')

  expect(secondDevice).toMatchObject(device)

  secondDevice.operationMode = 'Heat'

  expect(secondDevice).not.toMatchObject(device)

  expect(secondDevice.operate).toBe(Power.On)
  expect(secondDevice.airSwingUD).toBe(AirSwingUD.DownMid)
  expect(secondDevice.operationMode).toBe(OperationMode.Heat)
  expect(secondDevice.fanSpeed).toBe(FanSpeed.HighMid)
  expect(secondDevice.temperatureSet).toBe(20)

  expect(secondDevice.toJSON()).toMatchObject({
    operate: 'On',
    operationMode: 'Heat',
    fanSpeed: 'HighMid',
    airSwingUD: 'DownMid',
    temperatureSet: 20
  })
})
