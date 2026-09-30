import { connectDB, disconnectDB } from '../config/db';
import { seedDatabase } from './seedData';
import dotenv from 'dotenv';

dotenv.config();

async function runStandaloneSeed() {
  try {
    console.log('--- Running Standalone Seed Script ---');
    await connectDB();
    await seedDatabase();
    console.log('--- Standalone Seed Finished ---');
    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('Seed execution error:', err);
    process.exit(1);
  }
}

runStandaloneSeed();
