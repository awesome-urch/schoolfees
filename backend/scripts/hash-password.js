const bcrypt = require('bcryptjs');

const password = process.argv[2] || 'Admin@123??';

bcrypt.hash(password, 10).then(hash => {
  console.log('\n=================================');
  console.log('Password:', password);
  console.log('=================================');
  console.log('Hashed Password:');
  console.log(hash);
  console.log('=================================\n');
  console.log('SQL Update Command:');
  console.log(`UPDATE super_admins SET password = '${hash}' WHERE email = 'admin@schoolfees.com.ng';`);
  console.log('=================================\n');
});
