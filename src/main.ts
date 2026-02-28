import express from "express";
import { config } from "./config/index.ts";
import cors from "cors";
import helmet from "helmet";
import { setRoutes } from "./interfaces/router.ts";

// Web server
const app = express();

// Global middlewares
app.use(helmet()); // Basic security headers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurable CORS
const allowedOrigins = config("app.allowedOrigins");
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes("*")) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

setRoutes(app);

// App constants
const PORT = config("app.port");
const HOST = "127.0.0.1";

// Launch liesten to requests
app.listen(PORT, () => {
  console.log(`Application started \nhttp://${HOST}:${PORT}`);
});
