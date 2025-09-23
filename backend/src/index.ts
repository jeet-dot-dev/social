// backend/index.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import axios from "axios";
import crypto from "crypto";
import router from "./routes/authRoute.js";
import socialrouter from "./routes/socialRoute.js";
import authrouter from "./routes/authRoute.js";
import mediarouter from "./routes/mediaRoutes.js";
import postrouter from "./routes/postRoutes.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(bodyParser.json());

app.use("/api/v1/auth", authrouter);
app.use("/api/media", mediarouter);
app.use("/api/posts", postrouter);
app.use("/", socialrouter);

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
