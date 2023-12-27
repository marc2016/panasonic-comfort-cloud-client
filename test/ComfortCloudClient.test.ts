import { ComfortCloudClient } from '../src/ComfortCloudClient.js'
import { Group } from '../src/model/Group.js'
import { Device } from '../src/model/Device.js'
import * as auth from './auth_data.json'

const password = auth.default.password
const username = auth.default.username

const client = new ComfortCloudClient()

test('login', async () => {
  await client.login(username, password)
})

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
})

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
