import Purchase from "../models/Purchase.js";

export const verifyIfCourseAlreadyPurchased = async (req, res, next) => {
  try {
    const { courseId } = req.body;
    const userId = req.auth.userId;

    // Get latest purchase attempt
    const purchase = await Purchase.findOne({ courseId, userId }).sort({ createdAt: -1 });

    if (purchase) {
      switch (purchase.status) {
        case "completed":
          return res.status(409).json({
            success: false,
            message: "Course already purchased.",
          });

        case "pending":
          return res.status(402).json({
            success: false,
            message:
              "Your payment is still pending. If the amount was debited, please contact support.",
          });

        case "failed":
          // Optionally clean failed purchase
          await Purchase.deleteOne({ _id: purchase._id });
          break;

        default:
          console.warn(`Unexpected purchase status: ${purchase.status}`);
          break;
      }
    }

    next();
  } catch (error) {
    console.error("Error checking course purchase:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

