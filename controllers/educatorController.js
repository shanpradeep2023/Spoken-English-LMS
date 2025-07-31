import { clerkClient } from "@clerk/express";
import Course from "../models/Course.js"; // Assuming you have a Course model defined
import  { v2 as cloudinary } from "cloudinary";

// Update user role to educator
export const updateRoleToEducator = async (req, res) => {
    try{
        const userId = req.auth.userId; // Assuming userId is available in req.auth
        await clerkClient.users.updateUserMetadata(userId , {
            publicMetadata: {
                role: "educator"
            }
        })

        res.status(200).json({ success: true, message: "User role updated to educator successfully" });
    }catch (error) {
        res.status(400).json({ success: false, error: `Error updating role: ${error.message}` });
    }
}

//ADD New Course
export const addCourse = async (req, res) => {
    try{
        const { courseData } = req.body;
        const imageFile = req.file; // Assuming you're using multer for file uploads
        const educatorId = req.auth.userId; // Assuming userId is available in req.auth
        
        if(!imageFile) {
            res.status(400).json({ success: false, error: "Image file is required" });
        }

        const parsedCourseData = await JSON.parse(courseData);
        parsedCourseData.educator = educatorId; // Set the educator field to the current user's ID
        const newCourse = await Course.create(parsedCourseData);
        const imageUpload = await cloudinary.uploader.upload(imageFile.path);
        newCourse.courseThumbnail = imageUpload.secure_url;
        await newCourse.save();
        res.status(201).json({ success: true, course: newCourse });

    } catch(e) {
        res.status(500).json({ success: false, error: `Error adding course: ${e.message}` });
    }
}

// Get all courses by educator
export const getCoursesByEducator = async (req, res) => {
    try {
        const educator = req.auth.userId; // Assuming userId is available in req.auth
        const courses = await Course.find({ educator });
        res.status(200).json({ success: true, courses });

    } catch (error) {
        res.status(500).json({ success: false, error: `Error fetching courses: ${error.message}` });
    }
}

// Educator Dashboard Data
export const educatorDashboardData = async (req, res) => {
    try {
        const educator = req.auth.userId; 
        const courses = await Course.find({ educator });
        const totalCourses = courses.length;

        const courseIds = courses.map(course => course._id);

        const purchases = await Purchase.find({ 
            course: { $in: courseIds },
            status: "completed"
        });

        const totalEarnings = purchases.reduce((acc, purchase) => acc + purchase.amount, 0);

        // Collect unique enrolled student Ids with title
        const enrolledStudentsData = [];
        for(const course of courses) {
            const students = await User.find({
                _id: { $in: course.enrolledStudents },
            
            }, 'name imageUrl'); // Assuming User model has name and imageUrl fields
            students.forEach(student => {
                enrolledStudentsData.push({
                    courseTitle: course.courseTitle,
                    student
                });
            });
        }

        res.status(200).json({ success: true, data: {
            totalEarnings, enrolledStudentsData, totalCourses
        }});

    } catch (error) {

        res.status(500).json({ success: false, error: `Error fetching educator dashboard data: ${error.message}` });
        
    }
}

// Get Enrolled Students Data with Purchase Data
export const getEnrolledStudentsData = async (req, res) => {
    try {
        const educator = req.auth.userId; 
        const courses = await Course.find({ educator });
        const courseIds = courses.map(course => course._id);

        const purchases = await Purchase.find({ 
            course: { $in: courseIds },
            status: "completed"
        }).populate('userId', 'name imageUrl').populate('courseId', 'courseTitle'); // Assuming Purchase model has user field

        const enrolledStudentsData = purchases.map(purchase => ({
            student: purchase.userId,
            courseTitle: purchase.courseId.courseTitle,
            purchaseDate: purchase.createdAt,
            amount: purchase.amount
        }));

        res.status(200).json({ success: true, data: enrolledStudentsData });

    } catch (error) {
        res.status(500).json({ success: false, error: `Error fetching enrolled students data: ${error.message}` });
    }
}