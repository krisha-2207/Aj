const prisma = require('./backend/src/utils/prisma');
const bcrypt = require('bcryptjs');

async function checkAndFixPasswords() {
  try {
    const passwordHash = await bcrypt.hash('admin123', 10);
    const users = await prisma.user.findMany();
    for (const u of users) {
      const match = await bcrypt.compare('admin123', u.password);
      console.log(`User ${u.username} (${u.email}, role: ${u.role}) password match with 'admin123':`, match);
      if (!match) {
        await prisma.user.update({
          where: { id: u.id },
          data: { password: passwordHash }
        });
        console.log(`✓ Password updated to 'admin123' for ${u.username}`);
      }
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

checkAndFixPasswords();
