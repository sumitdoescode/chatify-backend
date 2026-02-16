import mongoose from "mongoose";

console.log(process.env.MONGODB_URI);

export const connectDB = async () => {
    try {
        const connection = await mongoose.connect(process.env.MONGODB_URI as string);
        console.log("MongoDB connected", connection.connection.host);
    } catch (error) {
        if (error instanceof Error) {
            console.log("Couldn't connect to database", error);
            process.exit(1);
        }
    }
};
