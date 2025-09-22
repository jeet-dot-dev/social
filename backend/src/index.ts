// backend/index.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import router from "./routes/authRoute.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(bodyParser.json());

// Auth routes
app.use("/api/v1/auth", router);

// Health check route
app.get("/", (req, res) => {
  res.json({ message: "Social app backend is running!" });
});

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
