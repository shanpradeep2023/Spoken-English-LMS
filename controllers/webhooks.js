import { Webhook } from "svix";

import crypto from "crypto";
import User from "../models/User.js";
import Course from "../models/Course.js";
import Purchase from "../models/Purchase.js";
import razorpay from "../configs/razorpay.js";

// API Controller Function to manage Clerk user with db

export const clerkWebhooks = async (req, res) => {
  try {
    const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
    await whook.verify(JSON.stringify(req.body), {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    });

    const { data, type } = req.body;
    switch (type) {
      case "user.created": {
        const userData = {
          _id: data.id,
          email: data.email_addresses[0].email_address,
          name: data.first_name + " " + data.last_name,
          imageUrl: data.image_url,
        };
        await User.create(userData);
        res.status(200).json({ message: "User created successfully" });
        break;
      }

      case "user.updated": {
        const userData = {
          email: data.email_addresses[0].email_address,
          name: data.first_name + " " + data.last_name,
          imageUrl: data.image_url,
        };
        await User.findByIdAndUpdate(data.id, userData);
        res.status(200).json({ message: "User updated successfully" });
        break;
      }

      case "user.deleted": {
        await User.findByIdAndDelete(data.id);
        res.status(200).json({ message: "User deleted successfully" });
        break;
      }

      default:
        break;
    }
  } catch (error) {
    res
      .status(400)
      .json({ success: false, error: `Invalid Request : ${error.message}` });
  }
};

// Razorpay Webhook
export const razorpayWebhook = async (req, res) => {
  try {
    const webhookSignature = req.headers["x-razorpay-signature"];

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (webhookSignature !== expectedSignature) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid webhook signature" });
    }

    const event = req.body; // already parsed by express.json()
    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id;

      const order = await razorpay.orders.fetch(orderId);
      const purchaseId = order.receipt;
      const { userId, courseId } = order.notes || {};

      const purchase = await Purchase.findById(purchaseId);
      const user = await User.findById(userId);
      const course = await Course.findById(courseId);

      if (purchase && user && course) {
        if (!course.enrolledStudents.some((id) => id.equals(user._id))) {
          course.enrolledStudents.push(user._id);
          await course.save();
        }
        if (!user.enrolledCourses.some((id) => id.equals(course._id))) {
          user.enrolledCourses.push(course._id);
          await user.save();
        }
        purchase.status = "completed";
        purchase.gatewayPaymentId = payment.id;
        await purchase.save();
      }

    } else if (event.event === "payment.failed") {
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id;
      const order = await razorpay.orders.fetch(orderId);
      const purchaseId = order.receipt;
      const purchase = await Purchase.findById(purchaseId);
      if (purchase) {
        purchase.status = "failed";
        purchase.gatewayPaymentId = payment.id;
        await purchase.save();
      }
    }

    // handle other events if you want:
    // order.paid -> also indicates success

    return res.json({ received: true });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, error: `Webhook error: ${err.message}` });
  }
};
