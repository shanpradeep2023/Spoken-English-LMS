import express from "express";
import { addUserRating, getUserCourseProgress, getUserData, purchaseLink, updateUserCourseProgress, userEnrolledCourses } from "../controllers/userController.js";
// import { createRazorpayOrder, razorpayWebhook, verifyRazorpayPayment } from "../razorpay.js";

import {requireAuth} from "@clerk/express";

const userRouter = express.Router();

userRouter.get('/data', requireAuth() , getUserData);
userRouter.get('/enrolled-courses', requireAuth() ,userEnrolledCourses);

// Stripe
userRouter.post('/purchase', purchaseLink);

// Progress Routes
userRouter.post('/update-course-progress', requireAuth(), updateUserCourseProgress);
userRouter.get('/get-course-progress', requireAuth(), getUserCourseProgress);

// Rating
userRouter.post('/add-rating', requireAuth(), addUserRating)


// // Razorpay
// userRouter.post('/purchase-order', createRazorpayOrder)
// userRouter.post('/purchase-verify', verifyRazorpayPayment)
// userRouter.post('/purchase-webhook', razorpayWebhook)

export default userRouter;
