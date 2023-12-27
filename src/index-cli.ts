#!/usr/bin/env node

import { ComfortCloudClient } from './ComfortCloudClient.js'
import { Group } from './model/Group.js'
import { Device } from './model/Device.js'

import inquirer from 'inquirer'

async function start() {
  const answers = await inquirer
  .prompt([
    {
      type: 'input',
      name: 'username',
      message: "Username",
    },
    {
      type: 'password',
      message: 'Password',
      name: 'password',
    },
  ])
  const username: string = answers.username
  const password: string = answers.password

  const client = new ComfortCloudClient()
  await client.login(username, password)
  const groups = await client.getGroups()
  console.log(JSON.stringify(groups, null, '  '))
}

start()