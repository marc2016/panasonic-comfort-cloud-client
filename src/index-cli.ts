#!/usr/bin/env node

import { ComfortCloudClient } from './ComfortCloudClient.js'
import { Group } from './model/Group.js'
import { Device } from './model/Device.js'

import { input, useEffect } from '@inquirer/prompts'
import password from '@inquirer/password'
import select from '@inquirer/select'
import { DataMode } from './domain/enums.js'
import { OAuthClient } from './OAuthClient.js'

type Command = 'get-group' | 'get-device' | 'refresh-token' | 'print-tokens' | 'exit' | null
type DeviceCommand = 'get-history' | 'print-device' | 'exit' | null

let client: ComfortCloudClient

async function SelectCommand(): Promise<Command> {
  const nextCommand: Command = await select({
    message: 'Select a package manager',
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

async function SelectDevice(selectedGroup: Group) : Promise<Device|Group> {
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
  const selectedObj: Device|Group = await select({
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
      const historyData = await client.getDeviceHistoryData(device.guid, new Date(), DataMode.Day)
      console.log(JSON.stringify(historyData, null, 2))
      break;
    case 'print-device':
      console.log(JSON.stringify(device, null, 2))
      break;
    default:
      break;
  }
}

async function start() {
  

  const answers = {
    username: await input({ message: 'Username' }),
    password: await password({ message: 'Password' }),
  }

  client = new ComfortCloudClient()
  await client.login(answers.username, answers.password)
  console.log('Login successful.')

  
  let nextCommand: Command = null
  while(nextCommand != 'exit') {
    nextCommand = await SelectCommand()
    switch (nextCommand) {
      case 'get-device':
        await GetDevice()
        break
      case 'get-group':
        const selectedGroup = await SelectGroup()
        const deviceOrGroup = await SelectDevice(selectedGroup)
        if(deviceOrGroup instanceof Group)
          console.log(JSON.stringify(deviceOrGroup, null, 2))
        else
          await SelectDeviceCommand(deviceOrGroup)
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
  }
}

start()
