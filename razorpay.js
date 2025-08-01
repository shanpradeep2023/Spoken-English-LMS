// import Razorpay from "razorpay";
// import crypto from "crypto";
// import Purchase from "./models/Purchase.js";
// import User from "./models/User.js";
// import Course from "./models/Course.js";

// // Initialize Razorpay instance
// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET,
// });

// // Create Razorpay order
// export const createRazorpayOrder = async (req, res) => {
//   try {
//     const { courseId } = req.body;
//     const userId = req.auth.userId;
//     const userData = await User.findById(userId);
//     const courseData = await Course.findById(courseId);

//     if (!userData || !courseData) {
//       return res
//         .status(404)
//         .json({ success: false, error: "User or Course not found" });
//     }

//     const amount = (
//       courseData.coursePrice -
//       (courseData.discount * courseData.coursePrice) / 100
//     ).toFixed(2);
//     const purchaseData = {
//       courseId: courseData._id,
//       userId: userData._id,
//       amount,
//     };
//     const newPurchase = await Purchase.create(purchaseData);

//     const options = {
//       amount: Math.floor(amount * 100), // amount in paise
//       currency: "INR",
//       receipt: newPurchase._id.toString(),
//       notes: {
//         userId: userData._id.toString(),
//         courseId: courseData._id.toString(),
//       },
//     };
//     const order = await razorpay.orders.create(options);
//     res.json({ success: true, order });
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// };

// // Verify Razorpay payment signature
// export const verifyRazorpayPayment = (req, res) => {
//   const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
//     req.body;
//   const sign = razorpay_order_id + "|" + razorpay_payment_id;
//   const expectedSignature = crypto
//     .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//     .update(sign.toString())
//     .digest("hex");

//   if (expectedSignature === razorpay_signature) {
//     // Payment is successful and verified
//     res.json({ success: true, message: "Payment verified successfully" });
//     // Update your DB here (enroll user, mark purchase as completed, etc.)
//   } else {
//     res.status(400).json({ success: false, message: "Invalid signature" });
//   }
// };

// // Razorpay webhook handler (optional)
// export const razorpayWebhook = (req, res) => {
//   // Handle Razorpay webhook events here
//   res.status(200).json({ status: "ok" });
// };

// // Example Express route usage (add to your server.js if needed):
// // import { createRazorpayOrder, verifyRazorpayPayment, razorpayWebhook } from "./razorpay.js";
// // app.post("/api/razorpay/order", createRazorpayOrder);
// // app.post("/api/razorpay/verify", verifyRazorpayPayment);
// // app.post("/api/razorpay/webhook", razorpayWebhook);
