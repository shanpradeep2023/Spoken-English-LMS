import Purchase from "../models/Purchase.js";

// Middleware to verify if the user has already purchased the course
export const verifyIfCourseAlreadyPurchased = async (req, res, next) => {
  try {
    const { courseId } = req.body;
    const userId = req.auth.userId;

    const purchase = await Purchase.findOne({ courseId, userId });

    if (purchase) {
      return res.status(400).json({ success: false, message: "Course already purchased" });
    }

    next();
  } catch (error) {
    console.error("Error checking course purchase:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
