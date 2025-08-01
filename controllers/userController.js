
import User from "../models/User.js";
import Purchase from "../models/Purchase.js";
import Stripe from "stripe";
import Course from "../models/Course.js";

// Get user data
export const getUserData = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    res
      .status(500)
      .json({
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

    res.status(200).json({ success: true, enrolledCourses: userData.enrolledCourses });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        error: `Error fetching User Enrolled Courses: ${error.message}`,
      });
  }
};

// Purchase link for user
export const purchaseLink = async (req, res) => {
    try {
        const { courseId } = req.body;
        const origin = req.headers;
        const userId = req.auth.userId;
        const userData = await User.findById(userId);
        const courseData = await Course.findById(courseId);

        if (!userData || !courseData) {
            return res.status(404).json({ success: false, error: "User or Course not found" });
        }

        const purchaseData = {
            courseId: courseData._id,
            userId: userData._id,
            amount: (courseData.coursePrice - courseData.discount * courseData.coursePrice / 100).toFixed(2), 
        }

        const newPurchase = await Purchase.create(purchaseData);

        //Stripe payment link creation
        const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
        const currency = process.env.CURRENCY.toLowerCase();

        const line_items = [{
            price_data:{
                currency,
                product_data: {
                    name: courseData.courseTitle,
                },
                unit_amount: Math.floor(purchaseData.amount * 100),

            },
            quantity: 1
        }];

        const session = await stripeInstance.checkout.sessions.create({
            success_url: `${origin}/loading/my-enrollments`,
            cancel_url: `${origin}/`,
            line_items: line_items,
            mode: "payment",
            metadata: {
                purchaseId: newPurchase._id.toString(),
                userId: userData._id.toString(),
            }
        })

        res.status(200).json({ success: true, sessionUrl: session.url });

    } catch (error) {
        res.status(500).json({ success: false, error: `Error creating purchase link: ${error.message}` });
    }
}
