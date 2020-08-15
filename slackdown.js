
const emoji = require('node-emoji')
const { WebClient } = require('@slack/web-api')
const fs = require('fs-extra')

const markdown = []
const userMap = {}

let slackClient
// process.env.HOURS_BACK
const lastTime = new Date(Date.now() - (24 * 60 * 60 * 1000))

const getChannels = async () => {
  let results = await slackClient.conversations.list()
  if (results.ok) {
    return results.channels
  }
  return []
}

const getUsers = async () => {
  const res = await slackClient.users.list()
  if (res.ok) {
    res.members.forEach((user) => {
      userMap[user.id] = user
    })
    return res.members
  }
  return []
}

const getConversationsForChannel = async (id) => {
  const results = await slackClient.conversations.history({
    channel: id,
    oldest: lastTime.getTime() / 1000,
    limit: 10000
  })
  if (results.ok && results.messages.length > 0) {
    let msgs = results.messages.reverse().filter((msg) => msg.subtype !== 'bot_message' && msg.subtype !== 'channel_join')
    return msgs
  }
  return []
}

function replaceUserIds(str) {
  // userids are <@...>
  const regex = new RegExp(/<@[a-zA-Z0-9]*>/g)
  let retVal = str.replace(regex, (st) => {
    const userId = st.substring(2, st.length - 1)
    const userName = getUserById(userId).name
    if (userName) {
      return '@' + userName
    }
    else {
      console.log('could not find ', st)
      return st
    }
  })
  return retVal
}

function formatMessage(msg) {
  const withBullets = msg.split('• ').join('- ')
  const blockQuote = '> ' + withBullets.split('\n').join('\n> ') + '\n> '
  return emoji.emojify(replaceUserIds(blockQuote))
}

function getUserById(id) {
  let user = userMap[id]
  if (!user) {
    user = getUserById(id)
    userMap[id] = user
  }
  return user
}

async function slackdown(slackToken) {

    if (!slackToken) {
        throw new Error('Missing slackToken')
    }

    slackClient = new WebClient(slackToken)

  const users = await getUsers()

  markdown.push(`## Cordova Slack Digest\n${new Date().toUTCString()}\n`)
  markdown.push(`[User count: ${users.length}](https://cordova.slack.com/)\n\n`)
  markdown.push(`Join the conversation at [slack.cordova.io](http://slack.cordova.io/)\n`)

  const channels = await getChannels()
  await Promise.all(channels.map(async (ch) => {
    const msgs = await getConversationsForChannel(ch.id)
    if (msgs.length > 0) {
      markdown.push(`### __Channel #${ch.name}__ _(${msgs.length} messages)_`)
      markdown.push('---\n')
      msgs.forEach((msg) => {
        let date = new Date(msg.ts * 1000)
        markdown.push(`${date.toUTCString()}\n`)
        markdown.push(`__@${getUserById(msg.user).name}__ says \n${formatMessage(msg.text)}\n`)
      })
    }
  }))

  const now = new Date()
  const month = now.getMonth() + 1
  const fileDateName = `digest/${now.getFullYear()}-${month > 9 ? month : '0' + month}-${now.getDate()}.md`
  fs.writeFile(fileDateName, markdown.join('\n'))
  console.log('markdown=', markdown.join('\n'))
}

module.exports = slackdown