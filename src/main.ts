import express from "express";
import { config } from "./config/index.ts";
import cors from "cors";
import { setRoutes } from "./interfaces/router.ts";

// Web server
const app = express();

// Global middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({}));
setRoutes(app);

// App constants
const PORT = config("app.port");
const HOST = "127.0.0.1";

// Launch liesten to requests
app.listen(PORT, () => {
  console.log(`Application started \nhttp://${HOST}:${PORT}`);
});
