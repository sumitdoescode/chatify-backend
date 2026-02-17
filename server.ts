import app from "./app";
import { connectDB } from "./lib/db";
import dns from "node:dns/promises";

dns.setServers(["1.1.1.1", "1.0.0.1"]); // Cloudflare DNS

(async () => {
    try {
        await connectDB();
        // start listening to port
        const PORT = process.env.PORT || 8000;
        app.listen(PORT, () => {
            console.log(`Server started on port ${PORT}`);
        });
    } catch (error) {
        console.log(error);
    }
})();
