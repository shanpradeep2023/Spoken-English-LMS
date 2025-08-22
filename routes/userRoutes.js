import express from "express";
import {
  addUserRating,
  getSignedVideoToken,
  getUserCourseProgress,
  getUserData,
  purchaseLink,
  updateUserCourseProgress,
  userEnrolledCourses,
  verifyRazorpayPayment,
} from "../controllers/userController.js";

import { requireAuth } from "@clerk/express";
import { verifyIfCourseAlreadyPurchased } from "../middlewares/purchaseVerifyMiddleware.js";

const userRouter = express.Router();

userRouter.get("/data", requireAuth(), getUserData);
userRouter.get("/enrolled-courses", requireAuth(), userEnrolledCourses);

// Razorpay
userRouter.post("/purchase", requireAuth(), verifyIfCourseAlreadyPurchased, purchaseLink);
userRouter.post("/purchase/verify", requireAuth(), verifyRazorpayPayment);

// Progress Routes
userRouter.post("/update-course-progress", requireAuth(), updateUserCourseProgress);
userRouter.get("/get-course-progress", requireAuth(), getUserCourseProgress);

// Rating
userRouter.post("/add-rating", requireAuth(), addUserRating);

// Get signed video token
userRouter.post("/video/token", requireAuth(), getSignedVideoToken);

export default userRouter;
