const readline = require('readline');
const bcrypt = require('bcryptjs');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question('Password to hash: ', async (password) => {
  rl.close();
  if (!password) {
    console.error('No password provided.');
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, 12);
  console.log('\nAdd this to your .env as DASHBOARD_PASSWORD_HASH:\n');
  console.log(hash);
});
