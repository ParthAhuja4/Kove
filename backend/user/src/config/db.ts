import mongoose from "mongoose";
import type { Mongoose } from "mongoose";

const connectDB = async (): Promise<void> => {
  try {
    const connectionInstance: Mongoose = await mongoose.connect(
      `${process.env["MONGODB_URI"]}`
    );
    console.log(
      `MONGO DB CONNECTED WITH HOST AS ${connectionInstance.connection.host}, db: ${connectionInstance.connection.name}`
    );
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

export default connectDB;
