import { config } from "dotenv";

// First try to load .env.local, then fallback to .env
config({ path: ".env.local" });
config({ path: ".env" });
