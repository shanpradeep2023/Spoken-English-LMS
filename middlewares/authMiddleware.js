import { clerkClient } from "@clerk/express";

//Middleware Protect educator route

export const protectEducator = async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    const response = await clerkClient.users.getUser(userId);

    if (response.publicMetadata.role !== "educator") {
      res
        .status(500)
        .json({ success: false, error: `User is not Educator: ${e.message}` });
    }

    next();
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        error: `Something went wrong : ${error.message}`,
      });
  }
};
