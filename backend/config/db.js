import mongoose from "mongoose";

const connectDB = async () => {
  const mongoUri =
    process.env.MONGO_URI || "mongodb://127.0.0.1:27017/budget_buddy";

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("MongoDB connected");
  } catch (error) {
    console.error(
      "MongoDB connection error:",
      error.message,
      "| Continuing without DB connection"
    );
  }
};

export default connectDB;
