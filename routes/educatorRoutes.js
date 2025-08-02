import express from "express";
import { addCourse, educatorDashboardData, getCoursesByEducator, getEnrolledStudentsData, updateRoleToEducator } from "../controllers/educatorController.js";
import upload from "../configs/multer.js";
import { protectEducator } from "../middlewares/authMiddleware.js";

import {requireAuth} from "@clerk/express";

const educatorRouter = express.Router();

// Add Educator Roles
educatorRouter.get('/update-role', requireAuth() ,updateRoleToEducator);
educatorRouter.post('/add-course', requireAuth() , upload.single('image'), protectEducator, addCourse);
educatorRouter.get('/get-courses', requireAuth() , protectEducator, getCoursesByEducator);
educatorRouter.get('/dashboard', requireAuth() , protectEducator, educatorDashboardData);
educatorRouter.get('/enrolled-students', requireAuth() , protectEducator, getEnrolledStudentsData);

export default educatorRouter;
