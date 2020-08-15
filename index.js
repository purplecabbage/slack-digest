const core = require('@actions/core')
const slackdown = require('./slackdown')


// most @actions toolkit packages have async methods
async function run() {
  try {
    const token = core.getInput('slack-token');

    core.info(`Using slackToken ${token}`);

    core.debug((new Date()).toTimeString()); // debug is only output if you set the secret `ACTIONS_RUNNER_DEBUG` to true
    
    await slackdown( token )

    core.info((new Date()).toTimeString());

    core.setOutput('time', new Date().toTimeString());

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
