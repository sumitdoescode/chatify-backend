import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error("Please add your Mongo URI to .env.local");
}

export const connectDB = async () => {
    try {
        const connection = await mongoose.connect(MONGODB_URI);
        console.log("MongoDB connected", connection.connection.host);
    } catch (error) {
        if (error instanceof Error) {
            console.log("Couldn't connect to database", error);
            process.exit(1);
        }
    }
};

export const getDB = () => mongoose.connection.db;
