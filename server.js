import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./configs/mongodb.js";
import { clerkWebhooks, razorpayWebhook } from "./controllers/webhooks.js";
import { clerkMiddleware } from "@clerk/express";
import connectCloudinary from "./configs/cloudinary.js";
import educatorRouter from "./routes/educatorRoutes.js";
import courseRouter from "./routes/courseRoutes.js";
import userRouter from "./routes/userRoutes.js";

//Initialize Express
const app = express();

//Connect to DB
await connectDB();

//Connect to Cloudinary
await connectCloudinary();

// Allowed origins
const allowedOrigins = [
  "https://masteringspokenenglish.netlify.app",
  "http://localhost:5173",
  "https://88v12321-5173.inc1.devtunnels.ms",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

//MiddleWare
app.use(clerkMiddleware());

//Clerk Webhook Route
app.post("/clerk", express.json(), clerkWebhooks);

// Razorpay webhook (NO auth here; must be public)
app.post("/webhooks/razorpay", express.json(), razorpayWebhook);

//Educator Routes
app.use("/api/educator", express.json(), educatorRouter);

//Course Routes
app.use("/api/course", express.json(), courseRouter);

//User Routes
app.use("/api/user", express.json(), userRouter);

//Default Route
app.get("/", (req, res) => {
  res.send({ msg: "Api Working" });
});

//Port
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
