import { db } from './index';
import { countries, cities, admins } from './schema';
import argon2 from 'argon2';

console.log('🌱 Seeding database...');

try {
    // Seed Countries
    console.log('📍 Seeding countries...');
    const [uae, saudi] = await db.insert(countries).values([
        {
            name: { en: 'United Arab Emirates', ar: 'الإمارات العربية المتحدة' },
            phoneCode: '+971',
            currency: 'UAE Dirham',
            currencyCode: 'AED',
            currencySymbol: 'د.إ',
            avatar: 'https://flagcdn.com/w320/ae.png', // Using flag URL instead of emoji
            isActive: true,
        },
        {
            name: { en: 'Saudi Arabia', ar: 'المملكة العربية السعودية' },
            phoneCode: '+966',
            currency: 'Saudi Riyal',
            currencyCode: 'SAR',
            currencySymbol: 'ر.س',
            avatar: 'https://flagcdn.com/w320/sa.png',
            isActive: true,
        },
    ]).returning();

    console.log(`✅ Created ${2} countries`);

    // Seed Cities
    console.log('🏙️  Seeding cities...');
    await db.insert(cities).values([
        {
            name: { en: 'Dubai', ar: 'دبي' },
            countryId: uae.id,
            timezone: 'Asia/Dubai',
            baseDeliveryFee: '8.00',
            freeDeliveryThreshold: '100.00',
            serviceFee: '2.00', // Fixed amount
            taxRate: '5.00',    // Percentage
            geoBounds: [
                [25.3569, 55.5136], // Northeast
                [25.3569, 54.9705],
                [24.7736, 54.9705], // Southwest
                [24.7736, 55.5136],
                [25.3569, 55.5136]  // Close loop
            ],
            isActive: true,
        },
        {
            name: { en: 'Abu Dhabi', ar: 'أبو ظبي' },
            countryId: uae.id,
            timezone: 'Asia/Dubai',
            baseDeliveryFee: '12.00',
            freeDeliveryThreshold: '120.00',
            serviceFee: '2.00',
            taxRate: '5.00',
            geoBounds: [
                [24.5465, 54.7321],
                [24.5465, 54.2707],
                [24.2092, 54.2707],
                [24.2092, 54.7321],
                [24.5465, 54.7321]
            ],
            isActive: true,
        },
        {
            name: { en: 'Riyadh', ar: 'الرياض' },
            countryId: saudi.id,
            timezone: 'Asia/Riyadh',
            baseDeliveryFee: '10.00',
            freeDeliveryThreshold: '100.00',
            serviceFee: '2.50',
            taxRate: '15.00',
            geoBounds: [
                [24.9247, 46.8728],
                [24.9247, 46.3662],
                [24.4539, 46.3662],
                [24.4539, 46.8728],
                [24.9247, 46.8728]
            ],
            isActive: true,
        },
    ]);

    console.log(`✅ Created ${3} cities`);

    // Seed Admin User
    console.log('👤 Creating admin user...');
    const hashedPassword = await argon2.hash('Admin@123456');

    await db.insert(admins).values({
        username: 'admin',
        email: 'admin@onway.com',
        // phone is NOT present in admins schema, removing it
        passwordHash: hashedPassword,
        role: 'owner',
        countryId: uae.id,
        cityId: null,
        isActive: true,
    });

    console.log('✅ Created admin user');
    console.log('');
    console.log('📧 Admin Credentials:');
    console.log('   Email:    admin@onway.com');
    console.log('   Password: Admin@123456');
    console.log('');
    console.log('🎉 Database seeded successfully!');

    process.exit(0);
} catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
}
