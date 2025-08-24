import User from "../models/User.js";
import Purchase from "../models/Purchase.js";
import Stripe from "stripe";
import crypto from "crypto";
import razorpay from "../configs/razorpay.js";
import Course from "../models/Course.js";
import CourseProgress from "../models/CourseProgress.js";
import jwt from "jsonwebtoken";

import { getAuth } from "@clerk/express";

// Get user data
export const getUserData = async (req, res) => {
  try {
    const userId = req.auth.userId;
    //console.log(userId);
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Error fetching User Data: ${error.message}`,
    });
  }
};

// User enrolled courses with lectures Link
export const userEnrolledCourses = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const userData = await User.findById(userId).populate("enrolledCourses");

    res
      .status(200)
      .json({ success: true, enrolledCourses: userData.enrolledCourses });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Error fetching User Enrolled Courses: ${error.message}`,
    });
  }
};

// Purchase link for user
// export const purchaseLink = async (req, res) => {
//   try {
//     const { courseId } = req.body;
//     const origin = req.headers.origin || "http://localhost:3000";
//     const userId = req.auth.userId;

//     console.log(userId, courseId);

//     const userData = await User.findById(userId);
//     const courseData = await Course.findById(courseId);

//     if (!userData) {
//       return res.status(404).json({ success: false, error: "User not found" });
//     }
//     if (!courseData) {
//       return res
//         .status(404)
//         .json({ success: false, error: "Course not found" });
//     }

//     const purchaseData = {
//       courseId: courseData._id,
//       userId: userData._id,
//       amount: (
//         courseData.coursePrice -
//         (courseData.discount * courseData.coursePrice) / 100
//       ).toFixed(2),
//     };

//     const newPurchase = await Purchase.create(purchaseData);

//     //Stripe payment link creation
//     const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
//     const currency = process.env.CURRENCY.toLowerCase();

//     const line_items = [
//       {
//         price_data: {
//           currency,
//           product_data: {
//             name: courseData.courseTitle,
//           },
//           unit_amount: Math.floor(purchaseData.amount * 100),
//         },
//         quantity: 1,
//       },
//     ];

//     const session = await stripeInstance.checkout.sessions.create({
//       success_url: `${origin}/loading/my-enrollments`,
//       cancel_url: `${origin}/`,
//       line_items: line_items,
//       mode: "payment",
//       metadata: {
//         purchaseId: newPurchase._id.toString(),
//         userId: userData._id.toString(),
//       },
//     });

//     res.status(200).json({ success: true, sessionUrl: session.url });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: `Error creating purchase link: ${error.message}`,
//     });
//   }
// };

//------------- CREATE ORDER (instead of Stripe session) -------------
export const purchaseLink = async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.auth.userId; // 👈 updated for Clerk
    const origin = req.headers.origin || "http://localhost:3000";

    const user = await User.findById(userId);
    const course = await Course.findById(courseId);
    if (!user)
      return res.status(404).json({ success: false, error: "User not found" });
    if (!course)
      return res
        .status(404)
        .json({ success: false, error: "Course not found" });

    const amountNumber = Number(
      (
        course.coursePrice -
        (course.discount * course.coursePrice) / 100
      ).toFixed(2)
    );
    const amountPaise = Math.round(amountNumber * 100);

    // Create a pending Purchase
    const purchase = await Purchase.create({
      courseId: course._id,
      userId: user._id,
      amount: amountNumber,
      status: "pending",
    });

    // Razorpay order creation
    let order;
    try {
      order = await razorpay.orders.create({
        amount: amountPaise,
        currency: process.env.CURRENCY || "INR",
        receipt: purchase._id.toString(),
        notes: {
          userId: user._id.toString(),
          courseId: course._id.toString(),
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: `Error creating Razorpay order: ${
          error.message || JSON.stringify(error)
        }`,
      });
    }

    // Return order details
    return res.status(200).json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      keyId: process.env.RAZORPAY_KEY_ID,
      callbackUrl: `${origin}/dashboard/student`,
    });
  } catch (err) {
    //console.error("purchaseLink error:", err);
    return res.status(500).json({
      success: false,
      error: `Error creating order: ${err.message || JSON.stringify(err)}`,
    });
  }
};

// export const purchaseLink = async (req, res) => {
//   try {
//     const { courseId } = req.body;
//     const userId = req.auth.userId; // Clerk
//     const origin = req.headers.origin || "http://localhost:3000";

//     const user = await User.findById(userId);
//     const course = await Course.findById(courseId);

//     if (!user)
//       return res.status(404).json({ success: false, error: "User not found" });
//     if (!course)
//       return res
//         .status(404)
//         .json({ success: false, error: "Course not found" });

//     const amountNumber = Number(
//       (
//         course.coursePrice -
//         (course.discount * course.coursePrice) / 100
//       ).toFixed(2)
//     );
//     const amountPaise = Math.round(amountNumber * 100); // Razorpay expects integer subunits

//     // 🔍 Check if a pending purchase already exists
//     let purchase = await Purchase.findOne({ courseId, userId, status: "pending" });

//     if (!purchase) {
//       // If no pending purchase, create a new one
//       purchase = await Purchase.create({
//         courseId: course._id,
//         userId: user._id,
//         amount: amountNumber,
//         status: "pending",
//       });
//     } else {
//       // If pending exists, update the amount in case discount changed
//       purchase.amount = amountNumber;
//       await purchase.save();
//     }

//     // Create Razorpay order
//     const order = await razorpay.orders.create({
//       amount: amountPaise,
//       currency: process.env.CURRENCY || "INR",
//       receipt: purchase._id.toString(), // link Razorpay order with Purchase doc
//       notes: {
//         userId: user._id.toString(),
//         courseId: course._id.toString(),
//       },
//     });

//     return res.status(200).json({
//       success: true,
//       order: {
//         id: order.id,
//         amount: order.amount,
//         currency: order.currency,
//       },
//       keyId: process.env.RAZORPAY_KEY_ID,
//       callbackUrl: `${origin}/dashboard/student`,
//     });
//   } catch (err) {
//     return res.status(500).json({
//       success: false,
//       error: `Error creating order: ${err.message || JSON.stringify(err)}`,
//     });
//   }
// };

// // ------------- VERIFY PAYMENT (server-side) -------------
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    // Verify signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid signature" });
    }

    // Fetch order to read our receipt/notes (metadata)
    const order = await razorpay.orders.fetch(razorpay_order_id);
    const purchaseId = order.receipt;
    const { userId, courseId } = order.notes || {};

    const purchase = await Purchase.findById(purchaseId);
    const user = await User.findById(userId);
    const course = await Course.findById(courseId);

    if (!purchase || !user || !course) {
      return res
        .status(404)
        .json({ success: false, error: "Purchase/User/Course not found" });
    }

    // Enroll (avoid duplicates)

    course.enrolledStudents.push(user._id);
    await course.save();

    user.enrolledCourses.push(course._id);
    await user.save();

    purchase.status = "completed";
    purchase.gatewayPaymentId = razorpay_payment_id; // optional field in your schema
    await purchase.save();

    return res
      .status(200)
      .json({ success: true, message: "Payment verified & enrollment done" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, error: `Verification error: ${err.message}` });
  }
};

// update user course Progress
export const updateUserCourseProgress = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { courseId, lectureId } = req.body;
    const progressData = await CourseProgress.findOne({ userId, courseId });

    if (progressData) {
      if (progressData.lectureCompleted.includes(lectureId)) {
        return res
          .status(200)
          .json({ success: true, message: "Lecture Already Completed" });
      }

      progressData.lectureCompleted.push(lectureId);
      await progressData.save();
    } else {
      await CourseProgress.create({
        userId,
        courseId,
        lectureCompleted: [lectureId],
      });
    }

    res.status(200).json({ success: true, message: "Progress Updated" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: `Something wrong: ${error.message}` });
  }
};

// Get User Course Progress
export const getUserCourseProgress = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { courseId } = req.body;
    const progressData = await CourseProgress.findOne({ userId, courseId });

    res.status(200).json({ success: true, progressData });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Error fetching user Progress: ${error.message}`,
    });
  }
};

// Rating
export const addUserRating = async (req, res) => {
  const userId = req.auth.userId;
  const { courseId, rating } = req.body;

  if (!courseId || !userId || !rating || rating < 1 || rating > 5) {
    res
      .status(500)
      .json({ success: false, error: `Invalid Details ${error.message}` });
  }

  try {
    const course = await Course.findById(courseId);

    if (!courseId) {
      return res
        .status(404)
        .json({ success: false, message: "Course not Found" });
    }

    const user = await User.findById(userId);

    if (!user || !user.enrolledCourses.includes(courseId)) {
      return res.status(404).json({
        success: false,
        message: "User has not purchased this course...",
      });
    }

    const existingRatingIndex = course.courseRatings.findIndex(
      (r) => r.userId === userId
    );

    if (existingRatingIndex > -1) {
      course.courseRatings[existingRatingIndex].rating = rating;
    } else {
      course.courseRatings.push({ userId, rating });
    }

    await course.save();

    res.status(200).json({ success: true, message: "Rating added" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: `Error Adding Rating: ${error.message}` });
  }
};

export const getSignedVideoToken = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { courseId, videoId } = req.body;

    //  Check if user is enrolled
    const user = await User.findById(userId);
    if (!user || !user.enrolledCourses.includes(courseId)) {
      return res.status(403).json({
        success: false,
        error: "Access denied. Not enrolled in course.",
      });
    }

    //  Short-lived token (2 minutes)
    const exp = Math.floor(Date.now() / 1000) + 120;

    const payload = {
      sub: videoId, // Cloudflare video UID
      kid: process.env.CLOUDFLARE_STREAM_KEY_ID, // Signing Key ID from Cloudflare
      exp,
    };

    const token = jwt.sign(payload, process.env.CLOUDFLARE_STREAM_SIGNING_KEY, {
      algorithm: "RS256",
    });

    const videoUrl = `https://videodelivery.net/${videoId}/manifest/video.m3u8?token=${token}`;

    return res.status(200).json({ success: true, videoUrl, exp });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: `Error generating video token: ${error.message}`,
    });
  }
};

// Dev Manual Route
// In userController.js (or a new adminController.js if you want restricted routes)

// ⚠️ Make sure only you (admin) can call this API – do NOT expose to normal users
export const manualEnrollUser = async (req, res) => {
  try {
    const { userId, courseId } = req.body;

    const user = await User.findById(userId);
    const course = await Course.findById(courseId);

    if (!user)
      return res.status(404).json({ success: false, error: "User not found" });
    if (!course)
      return res
        .status(404)
        .json({ success: false, error: "Course not found" });

    // Already enrolled?
    if (user.enrolledCourses.includes(course._id)) {
      return res
        .status(200)
        .json({ success: true, message: "User already enrolled" });
    }

    // Create a completed purchase record for audit trail
    await Purchase.create({
      courseId: course._id,
      userId: user._id,
      amount: course.coursePrice - (course.discount * course.coursePrice) / 100,
      status: "completed",
      gatewayPaymentId: "manual-" + Date.now(), // marker so you know this was manual
    });

    // Enroll user
    user.enrolledCourses.push(course._id);
    course.enrolledStudents.push(user._id);

    await user.save();
    await course.save();

    return res
      .status(200)
      .json({ success: true, message: "User manually enrolled" });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: `Error manually enrolling user: ${err.message}`,
    });
  }
};
