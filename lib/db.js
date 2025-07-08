import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/chalchitra";

if (!MONGO_URI) {
  throw new Error("⚠️ Please define the MONGO_URI environment variable");
}

export async function connectToDB() {
  if (mongoose.connection.readyState >= 1) return;

  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MONGO_URI", process.env.MONGO_URI)
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw new Error("Failed to connect to MongoDB");
  }
}
