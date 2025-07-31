import mongoose from "mongoose";

// Define the User schema
const userSchema = new mongoose.Schema(
    {
        _id: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        imageUrl: {
            type: String,
            required: true
        },
        enrolledCourses: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Course",
            }
        ],
    } , { timestamps: true }
);

// Create the User model
const User = mongoose.model('User', userSchema);
export default User;
