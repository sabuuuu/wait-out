import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';
import { eq } from 'drizzle-orm';

dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is missing in .env.local');
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

async function seed() {
  console.log('🌱 Seeding database for Pausy...');

  // 1. Get ALL users from auth schema
  const authUsers = await sql`SELECT id, email FROM auth.users`;
  
  if (authUsers.length === 0) {
    console.log('❌ No users found in auth.users. Please sign up in the app first!');
    process.exit(1);
  }
  
  console.log(`👤 Found ${authUsers.length} users. Seeding for all of them...`);

  for (const user of authUsers) {
    const userId = user.id;
    console.log(`▶️ Seeding for user: ${user.email || userId}`);

    // 2. Ensure profile exists
    await db.insert(schema.profiles).values({
      id: userId,
      displayName: user.email ? user.email.split('@')[0] : 'Pausy User',
      currency: 'DZD',
    }).onConflictDoNothing();

    // 3. Clean existing data for this user to avoid duplicates
    await db.delete(schema.items).where(eq(schema.items.userId, userId));
    await db.delete(schema.collections).where(eq(schema.collections.userId, userId));

    // 4. Create Collections
    const categories = [
      { name: 'Tech', emoji: '📱', color: '#3b82f6' },
      { name: 'Fashion', emoji: '👕', color: '#ec4899' },
      { name: 'Home', emoji: '🏠', color: '#10b981' },
      { name: 'Gaming', emoji: '🎮', color: '#8b5cf6' },
      { name: 'Health', emoji: '🥗', color: '#f59e0b' },
    ];

    const allCollections = await db.insert(schema.collections).values(
      categories.map(c => ({
        userId,
        name: c.name,
        emoji: c.emoji,
        color: c.color,
      }))
    ).returning();

    // 5. Create Items
    const itemsToSeed = [];
    const now = new Date();
    const randomDate = (daysAgo: number) => {
      const d = new Date();
      d.setDate(d.getDate() - Math.floor(Math.random() * daysAgo));
      return d;
    };

    // --- WAITING ---
    const waitingList = [
      { title: 'NuPhy Air75 V2', price: '28000', cat: 'Tech' },
      { title: 'Sony WH-1000XM5', price: '65000', cat: 'Tech' },
      { title: 'Carhartt Jacket', price: '22000', cat: 'Fashion' },
      { title: 'AeroPress Clear', price: '9500', cat: 'Home' },
      { title: 'Logitech MX Master 3S', price: '18000', cat: 'Tech' },
    ];

    for (const item of waitingList) {
      const col = allCollections.find(c => c.name === item.cat) || allCollections[0];
      itemsToSeed.push({
        userId,
        collectionId: col.id,
        title: item.title,
        price: item.price,
        currency: 'DZD',
        status: 'waiting',
        addedAt: randomDate(5),
        addedHour: 14,
        delayType: '7d',
        remindAt: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
        regretScore: Math.floor(Math.random() * 30) + 10,
        addedDayOfWeek: 1,
        sourcePlatform: 'web',
        categorySlug: col.name.toLowerCase(),
      });
    }

    // --- BOUGHT ---
    const boughtList = [
      { title: 'Kindle Paperwhite', price: '24000', cat: 'Tech' },
      { title: 'Nike Dunks Low', price: '19000', cat: 'Fashion' },
      { title: 'Lego Star Wars Set', price: '15000', cat: 'Gaming' },
      { title: 'Herman Miller Embody', price: '280000', cat: 'Home' },
      { title: 'Stanley Cup 40oz', price: '8500', cat: 'Home' },
    ];

    for (const item of boughtList) {
      const col = allCollections.find(c => c.name === item.cat) || allCollections[0];
      const addedAt = randomDate(45);
      itemsToSeed.push({
        userId,
        collectionId: col.id,
        title: item.title,
        price: item.price,
        currency: 'DZD',
        status: 'bought',
        addedAt,
        addedHour: 10,
        delayType: '3d',
        remindAt: new Date(addedAt.getTime() + 3 * 24 * 60 * 60 * 1000),
        regretScore: Math.floor(Math.random() * 20),
        outcome: 'bought',
        outcomeSetAt: randomDate(2),
        addedDayOfWeek: 3,
        sourcePlatform: 'instagram',
        categorySlug: col.name.toLowerCase(),
      });
    }

    // --- FORGOTTEN ---
    const forgotList = [
      { title: 'Electric Skateboard', price: '85000', cat: 'Tech' },
      { title: 'Designer Sunglasses', price: '42000', cat: 'Fashion' },
      { title: 'Juicer Machine', price: '12000', cat: 'Home' },
      { title: 'RGB Wall Lights', price: '18000', cat: 'Gaming' },
      { title: 'Massage Gun', price: '15000', cat: 'Health' },
    ];

    for (const item of forgotList) {
      const col = allCollections.find(c => c.name === item.cat) || allCollections[0];
      const addedAt = randomDate(90);
      itemsToSeed.push({
        userId,
        collectionId: col.id,
        title: item.title,
        price: item.price,
        currency: 'DZD',
        status: 'forgot',
        addedAt,
        addedHour: 22,
        delayType: '2w',
        remindAt: new Date(addedAt.getTime() + 14 * 24 * 60 * 60 * 1000),
        regretScore: Math.floor(Math.random() * 50) + 50,
        outcome: 'forgot',
        outcomeSetAt: randomDate(10),
        addedDayOfWeek: 6,
        sourcePlatform: 'tiktok',
        categorySlug: col.name.toLowerCase(),
      });
    }

    await db.insert(schema.items).values(itemsToSeed);
  }

  console.log('✨ Database is now FULL for ALL users!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seeding failed:');
  console.error(err);
  process.exit(1);
});
