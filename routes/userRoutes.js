import express from "express";
import { getUserData, purchaseLink, userEnrolledCourses } from "../controllers/userController.js";
// import { createRazorpayOrder, razorpayWebhook, verifyRazorpayPayment } from "../razorpay.js";

const userRouter = express.Router();

userRouter.get('/data', getUserData);
userRouter.get('/enrolled-courses', userEnrolledCourses);

// Stripe
userRouter.post('/purchase', purchaseLink);


// // Razorpay
// userRouter.post('/purchase-order', createRazorpayOrder)
// userRouter.post('/purchase-verify', verifyRazorpayPayment)
// userRouter.post('/purchase-webhook', razorpayWebhook)

export default userRouter;
