import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { seedDatabase } from '../seed/seedData';

let mongoMemoryServer: MongoMemoryServer | null = null;

export async function connectDB(): Promise<void> {
  const customUri = process.env.MONGODB_URI;

  if (customUri) {
    try {
      console.log(`Connecting to external MongoDB at ${customUri}...`);
      await mongoose.connect(customUri);
      console.log('MongoDB connected successfully to external URI.');
      await seedDatabase();
      return;
    } catch (err: any) {
      console.warn(`Failed to connect to MONGODB_URI: ${err.message}. Falling back to in-memory MongoDB.`);
    }
  }

  try {
    console.log('Initializing embedded MongoDB Memory Server for zero-config prototype execution...');
    mongoMemoryServer = await MongoMemoryServer.create();
    const uri = mongoMemoryServer.getUri();
    await mongoose.connect(uri);
    console.log(`Embedded MongoDB started and connected successfully at: ${uri}`);
    await seedDatabase();
  } catch (err: any) {
    console.error('Fatal error initializing MongoDB:', err);
    throw err;
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
}
