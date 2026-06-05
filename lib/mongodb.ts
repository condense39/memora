import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache;
}

const cached: MongooseCache = global.mongoose ?? { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (!MONGODB_URI) {
    throw new Error(
      "Please define the MONGODB_URI environment variable inside .env.local"
    );
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mg) => {
      return mg;
    });
  }

  try {
    cached.conn = await cached.promise;
    
    // Create text indexes for search (ignore if they already exist)
    try {
      await cached.conn.connection.collection('events').createIndex({ name: 'text', description: 'text' });
      await cached.conn.connection.collection('media').createIndex({ aiTags: 'text' });
    } catch (indexError) {
      console.error("Index creation error (can be ignored if already exists):", indexError);
    }
    
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
