const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Create default admin user
    const adminEmail = 'test@test.com';
    const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

    if (!existing) {
        const hashedPassword = await bcrypt.hash('Test123@123', 12);

        await prisma.user.create({
            data: {
                name: 'Admin',
                email: adminEmail,
                password: hashedPassword,
                role: 'admin',
                approved: true,
            },
        });

        console.log('✅ Admin user created: test@test.com / Test123@123');
    } else {
        console.log('ℹ️  Admin user already exists, skipping.');
    }

    console.log('✅ Seeding complete!');
}

main()
    .catch((e) => {
        console.error('Seed error:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
