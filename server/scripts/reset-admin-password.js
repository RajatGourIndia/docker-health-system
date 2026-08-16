// Account-recovery path for this self-hosted, no-email tool. Run inside the
// running container:
//
//   docker exec -it <container-name> npm run reset-admin-password
//
// Prompts for a new password interactively, or pass it as an argument to
// run non-interactively:
//
//   docker exec <container-name> npm run reset-admin-password -- 'NewPassw0rd!'
//
const readline = require('readline');
const authService = require('../services/authService');

async function promptForPassword() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const password = await new Promise((resolve) => rl.question('New admin password: ', resolve));
  rl.close();
  return password;
}

async function main() {
  const password = process.argv[2] || (await promptForPassword());

  try {
    await authService.resetPassword(password);
    console.log('Admin password updated. You can log in with the new password now.');
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
  }
}

main();
