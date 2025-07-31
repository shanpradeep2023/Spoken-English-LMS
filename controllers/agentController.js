import { clerkClient } from "@clerk/express";

export const updateUserToAgent = async (res, req) => {
    try{
        const userId = req.auth.userId; // Assuming userId is available in req.auth
        await clerkClient.users.updateUserMetadata(userId , {
            publicMetadata: {
                role: "agent"
            }
        })

        res.status(200).json({ success: true, message: "User role updated to agent successfully" });
    }catch (error) {
        res.status(400).json({ success: false, error: `Error updating role: ${error.message}` });
    }
}