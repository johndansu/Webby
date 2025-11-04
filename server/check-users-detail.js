const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('🔍 Checking users in database...\n');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    console.log(`📊 Total users found: ${users.length}\n`);
    
    if (users.length > 0) {
      console.log('👥 User Details:');
      console.log('='.repeat(80));
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.email}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Active: ${user.isActive}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log(`   Updated: ${user.updatedAt}`);
        console.log(`   Last Login: ${user.lastLoginAt || 'Never'}`);
      });
    } else {
      console.log('⚠️  No users found in database!');
    }
    
    // Check for any deleted users (check audit logs if they exist)
    try {
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          action: {
            contains: 'delete'
          },
          OR: [
            { entityType: 'User' },
            { entityType: 'user' }
          ]
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      });
      
      if (auditLogs.length > 0) {
        console.log('\n\n🗑️  Recent User Deletion Activity:');
        console.log('='.repeat(80));
        auditLogs.forEach((log, index) => {
          console.log(`\n${index + 1}. ${log.action} by ${log.userId}`);
          console.log(`   Time: ${log.createdAt}`);
          console.log(`   Details: ${JSON.stringify(log.details || {})}`);
        });
      }
    } catch (e) {
      // Audit logs table might not exist or have different structure
      console.log('\n\n⚠️  Could not check audit logs (table may not exist)');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
})();
