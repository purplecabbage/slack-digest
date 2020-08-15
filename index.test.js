const process = require('process');
const cp = require('child_process');
const path = require('path');
const slackdown = require('./slackdown')

test('throws if missing slack-token', async () => {
  await expect(slackdown()).rejects.toThrow('Missing slackToken');
});

// shows how the runner will run a javascript action with env / stdout protocol
test('test runs', () => {
  process.env['INPUT_MILLISECONDS'] = 500;
  const ip = path.join(__dirname, 'index.js');
  console.log(cp.execSync(`node ${ip}`, {env: process.env}).toString());
})
