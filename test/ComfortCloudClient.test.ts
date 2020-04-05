import { ComfortCloudClient } from '../src/ComfortCloudClient'
import { Group } from '../src/model/Group'
import { Device } from '../src/model/Device'
import * as auth from './auth_data.json'
import { Parameters, AirSwingLR } from '../src'

const password = auth.password
const username = auth.username

const client = new ComfortCloudClient()

test('login', async () => {
  await client.login(username, password, 6)
})

test('getGroups', async () => {
  await client.login(username, password, 6)
  const groups = await client.getGroups()
  if (groups.length > 0) {
    const firstGroup = groups[0]
    expect(firstGroup instanceof Group).toBeTruthy
    if (firstGroup.devices.length > 0) {
      const firstDevice = firstGroup.devices[0]
      expect(firstDevice instanceof Device).toBeTruthy
    }
  }
})

test('getDevice', async () => {
  jest.setTimeout(20000)
  const client = new ComfortCloudClient()
  await client.login(username, password, 6)
  const groups = await client.getGroups()
  if (groups.length > 0) {
    const firstGroup = groups[0]
    expect(firstGroup instanceof Group).toBeTruthy
    const firstDevice = firstGroup.devices[0]
    const device = await client.getDevice(firstDevice.guid)
    expect(device?.guid).toBe(firstDevice.guid)
  }
})

test('setDevice', async () => {
  jest.setTimeout(20000)
  const client = new ComfortCloudClient()
  await client.login(username, password, 6)
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
})
