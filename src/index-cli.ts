#!/usr/bin/env node

import { ComfortCloudClient } from './ComfortCloudClient.js'
import { Group } from './model/Group.js'
import { Device } from './model/Device.js'

import inquirer from 'inquirer'
import select, { Separator } from '@inquirer/select'
import { forEach } from 'lodash'
import { group } from 'console'

type Command = 'get-group' | 'get-device' | 'exit' | null

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
        name: 'Exit',
        value: 'exit',
        description: 'Exit script',
      },
    ],
  })
  return nextCommand
}

async function SelectDevice(selectedGroup: Group) {
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

  console.log(JSON.stringify(selectedObj, null, 2))
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
  const deviceGuid: string = await inquirer.prompt([
    {
      type: 'input',
      name: 'Guid',
      message: 'Guid of the device',
    },
  ])
  const device = await client.getDevice(deviceGuid)
  console.log(device, null, 2)
}

async function start() {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'username',
      message: 'Username',
    },
    {
      type: 'password',
      message: 'Password',
      name: 'password',
    },
  ])
  const username: string = answers.username
  const password: string = answers.password

  client = new ComfortCloudClient()
  await client.login(username, password)
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
        await SelectDevice(selectedGroup)
        break
      default:
        break
    }
  }
}

start()
