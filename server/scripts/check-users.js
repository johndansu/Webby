const { PrismaClient } = require('@prisma/client');
const path = require('path');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${path.join(__dirname, '../prisma/dev.db')}`
    }
  }
});

async function checkAllUsers() {
  try {
    console.log('🔍 Checking all users in database...\n');
    
    // Get all users including inactive ones
    const allUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const activeUsers = allUsers.filter(u => u.isActive);
    const inactiveUsers = allUsers.filter(u => !u.isActive);

    console.log(`📊 Summary:`);
    console.log(`   Total users in database: ${allUsers.length}`);
    console.log(`   Active users: ${activeUsers.length}`);
    console.log(`   Inactive users: ${inactiveUsers.length}\n`);

    if (allUsers.length > 0) {
      console.log('👥 All Users:');
      allUsers.forEach((user, index) => {
        const status = user.isActive ? '✅' : '❌';
        console.log(`   ${index + 1}. ${status} ${user.username} (${user.email}) - ${user.role} - Created: ${user.createdAt.toISOString()}`);
      });

      if (inactiveUsers.length > 0) {
        console.log('\n⚠️  Inactive Users (these might be your "missing" users):');
        inactiveUsers.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.username} (${user.email}) - Created: ${user.createdAt.toISOString()}`);
        });
        console.log('\n💡 To reactivate these users, use the admin panel or run:');
        inactiveUsers.forEach(user => {
          console.log(`   - User ID: ${user.id}`);
        });
      }
    } else {
      console.log('   No users found in database.');
    }

    // Check for duplicate emails or usernames
    const emails = allUsers.map(u => u.email);
    const usernames = allUsers.map(u => u.username);
    const duplicateEmails = emails.filter((email, index) => emails.indexOf(email) !== index);
    const duplicateUsernames = usernames.filter((username, index) => usernames.indexOf(username) !== index);

    if (duplicateEmails.length > 0 || duplicateUsernames.length > 0) {
      console.log('\n⚠️  Found duplicates:');
      if (duplicateEmails.length > 0) {
        console.log(`   Duplicate emails: ${[...new Set(duplicateEmails)].join(', ')}`);
      }
      if (duplicateUsernames.length > 0) {
        console.log(`   Duplicate usernames: ${[...new Set(duplicateUsernames)].join(', ')}`);
      }
    }

  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllUsers();

