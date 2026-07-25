#!/usr/bin/env node

import * as fs from 'fs'
import * as path from 'path'
import { ComfortCloudClient } from './ComfortCloudClient.js'
import { Group } from './model/Group.js'
import { Device } from './model/Device.js'
import { ServiceError } from './model/ServiceError.js'

import { input, useEffect } from '@inquirer/prompts'
import password from '@inquirer/password'
import select from '@inquirer/select'
import { DataMode } from './domain/enums.js'
import { OAuthClient } from './OAuthClient.js'
import { DEFAULT_APP_VERSION } from './domain/appVersion.js'

type Command = 'get-group' | 'get-device' | 'dump-all' | 'refresh-token' | 'print-tokens' | 'exit' | null
type DeviceCommand = 'get-history' | 'print-device' | 'exit' | null

let client: ComfortCloudClient

async function SelectCommand(): Promise<Command> {
  const nextCommand: Command = await select({
    message: 'Select a command',
    choices: [
      {
        name: 'Get groups',
        value: 'get-group',
        description: 'Get all groups for this account',
      },
      {
        name: 'Get device',
        value: 'get-device',
        description: 'Get a device for a given guid',
      },
      {
        name: 'Export anonymized test fixtures',
        value: 'dump-all',
        description: 'Call all endpoints, anonymize sensitive data, and save fixtures or print JSON',
      },
      {
        name: 'Print tokens',
        value: 'print-tokens',
        description: 'Print both OAuth token',
      },
      {
        name: 'Refresh token',
        value: 'refresh-token',
        description: 'Refresh the OAuth token',
      },
      {
        name: 'Exit',
        value: 'exit',
        description: 'Exit script',
      },
    ],
  })
  return nextCommand
}

async function SelectDevice(selectedGroup: Group): Promise<Device | Group> {
  console.log(`Found ${selectedGroup.devices.length} devices.`)
  const choicesDevices = new Array()
  for (let device of selectedGroup.devices) {
    choicesDevices.push({
      name: device.name,
      value: device,
    })
  }
  choicesDevices.push({
    name: 'Print group',
    value: selectedGroup,
  })
  const selectedObj: Device | Group = await select({
    message: 'Select a device or print group',
    choices: choicesDevices,
  })

  return selectedObj
}

async function SelectGroup(): Promise<Group> {
  var groups = await client.getGroups()
  console.log(`Found ${groups.length} groups.`)
  const choicesGroups = new Array()
  for (let group of groups) {
    choicesGroups.push({
      name: group.name,
      value: group,
    })
  }
  const selectedGroup: Group = await select({
    message: 'Select a group',
    choices: choicesGroups,
  })

  return selectedGroup
}

async function GetDevice() {
  const deviceGuid: string = await input(
    {
      message: 'Guid of the device',
    }
  )
  const device = await client.getDevice(deviceGuid)
  console.log(device, null, 2)
}

async function SelectDeviceCommand(device: Device) {
  const nextCommand: DeviceCommand = await select({
    message: `Select command for device ${device.name}.`,
    choices: [
      {
        name: 'Get history',
        value: 'get-history',
        description: 'Get history data for the device.',
      },
      {
        name: 'Print device',
        value: 'print-device',
        description: 'Prints all information of the device.',
      },
      {
        name: 'Exit',
        value: 'exit',
        description: 'Exit script',
      },
    ],
  })

  switch (nextCommand) {
    case 'get-history':
      const dataMode: DataMode = await select({
        message: 'Select data mode',
        choices: [
          { name: 'Day', value: DataMode.Day },
          { name: 'Week', value: DataMode.Week },
          { name: 'Month', value: DataMode.Month },
          { name: 'Year', value: DataMode.Year },
        ],
      })
      const historyData = await client.getDeviceHistoryData(device.guid, new Date(), dataMode)
      console.log(JSON.stringify(historyData, null, 2))
      break;
    case 'print-device':
      console.log(JSON.stringify(device, null, 2))
      break;
    default:
      break;
  }
}

function anonymizeData(obj: any): any {
  const guidMap = new Map<string, string>()
  const nameMap = new Map<string, string>()
  let guidCounter = 1
  let groupCounter = 1
  let deviceCounter = 1

  function replaceRecursive(val: any, keyName?: string): any {
    if (val === null || val === undefined) return val

    const cleanKey = keyName ? keyName.replace(/^_/, '') : ''

    if (typeof val === 'string') {
      if (cleanKey === 'deviceGuid' || cleanKey === 'guid') {
        if (!guidMap.has(val)) {
          guidMap.set(val, `anon-guid-${guidCounter++}`)
        }
        return guidMap.get(val)
      }
      if (cleanKey === 'groupName' || (cleanKey === 'name' && keyName === '_name' && val !== '')) {
        if (!nameMap.has(val)) {
          nameMap.set(val, `Anon Group ${groupCounter++}`)
        }
        return nameMap.get(val)
      }
      if (cleanKey === 'deviceName' || cleanKey === 'name') {
        if (val !== '') {
          if (!nameMap.has(val)) {
            nameMap.set(val, `Anon Device ${deviceCounter++}`)
          }
          return nameMap.get(val)
        }
        return val
      }
      return val
    }

    if (typeof val === 'number') {
      if (cleanKey === 'groupId' || cleanKey === 'id') {
        return 12345
      }
      return val
    }

    if (Array.isArray(val)) {
      return val.map((item) => replaceRecursive(item))
    }

    if (typeof val === 'object') {
      const copy: Record<string, any> = {}
      for (const key of Object.keys(val)) {
        let newKey = key
        if (guidMap.has(key)) {
          newKey = guidMap.get(key)!
        }
        copy[newKey] = replaceRecursive(val[key], key)
      }
      return copy
    }

    return val
  }

  return replaceRecursive(obj)
}

async function ExportAnonymizedFixtures() {
  console.log('\n========================================')
  console.log('  TESTING ALL ENDPOINTS & DUMPING FIXTURES  ')
  console.log('========================================\n')

  console.log('Fetching groups (getGroups)...')
  const rawGroups = await client.getGroups()

  const deviceResponses: Record<string, any> = {}
  const historyResponses: Record<string, any> = {}

  for (const group of rawGroups) {
    console.log(`Processing group: ${group.name} (${group.devices.length} devices)`)
    for (const device of group.devices) {
      console.log(`- Fetching getDevice() for ${device.name}...`)
      try {
        const deviceData = await client.getDevice(device.guid)
        deviceResponses[device.guid] = deviceData
      } catch (err: any) {
        console.error(`  Error fetching device ${device.name}:`, err.message || err)
      }

      console.log(`- Fetching getDeviceHistoryData(Day) for ${device.name}...`)
      try {
        const historyData = await client.getDeviceHistoryData(device.guid, new Date(), DataMode.Day)
        historyResponses[device.guid] = historyData
      } catch (err: any) {
        console.error(`  Error fetching history for ${device.name}:`, err.message || err)
      }
    }
  }

  const rawFixtures = {
    mockGroupResponse: rawGroups,
    mockDeviceResponses: deviceResponses,
    mockHistoryResponses: historyResponses,
  }

  console.log('\nAnonymizing response data...')
  const anonymizedFixtures = anonymizeData(rawFixtures)

  const outputChoice = await select({
    message: 'Where do you want to save/output the anonymized fixtures?',
    choices: [
      {
        name: 'Save to file (test/live-fixtures.json)',
        value: 'file',
        description: 'Write anonymized JSON directly to test/live-fixtures.json',
      },
      {
        name: 'Print to console (stdout)',
        value: 'console',
        description: 'Display formatted anonymized JSON in the terminal window',
      },
    ],
  })

  const jsonString = JSON.stringify(anonymizedFixtures, null, 2)

  if (outputChoice === 'file') {
    const targetPath = path.resolve(process.cwd(), 'test', 'live-fixtures.json')
    fs.writeFileSync(targetPath, jsonString, 'utf-8')
    console.log(`\n✅ Successfully saved anonymized fixtures to: ${targetPath}`)
  } else {
    console.log('\n--- ANONYMIZED FIXTURES JSON ---')
    console.log(jsonString)
  }

  console.log('\n========================================')
  console.log('  COMPLETED FIXTURE EXPORT  ')
  console.log('========================================\n')
}

async function start() {


  const versionInput = await input({ message: `App Version (default: ${DEFAULT_APP_VERSION})` })
  const appVersion = versionInput ? versionInput : DEFAULT_APP_VERSION

  const answers = {
    username: await input({ message: 'Username' }),
    password: await password({ message: 'Password' }),
  }

  client = new ComfortCloudClient(appVersion)
  await client.login(answers.username, answers.password)
  console.log('Login successful.')


  let nextCommand: Command = null
  while (nextCommand != 'exit') {
    nextCommand = await SelectCommand()
    try {
      switch (nextCommand) {
        case 'get-device':
          await GetDevice()
          break
        case 'get-group':
          const selectedGroup = await SelectGroup()
          const deviceOrGroup = await SelectDevice(selectedGroup)
          if (deviceOrGroup instanceof Group)
            console.log(JSON.stringify(deviceOrGroup, null, 2))
          else
            await SelectDeviceCommand(deviceOrGroup)
          break
        case 'dump-all':
          await ExportAnonymizedFixtures()
          break
        case 'print-tokens':
          console.log(`OAuth token: ${client.oauthClient.token}`)
          console.log(`OAuth refresh token: ${client.oauthClient.tokenRefresh}`)
          break
        case 'refresh-token':
          await client.oauthClient.refreshToken()
          console.log('Token refresh was successful.')
          break
        default:
          break
      }
    } catch (error: any) {
      console.error('An error occurred:', error)
      if (error instanceof ServiceError && error.details) {
        console.error('Service Error Details:', JSON.stringify(error.details, null, 2))
      }
      if (error.response) {
        console.error('Response Data:', error.response.data)
        console.error('Response Status:', error.response.status)
        console.error('Response Headers:', error.response.headers)
      }
    }
  }
}

start()
