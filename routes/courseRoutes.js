import express from "express";
import { getAllCourses, getCourseById } from "../controllers/courseController.js";
import { requireAuth } from "@clerk/express";

const courseRouter = express.Router();

courseRouter.get('/all', requireAuth() , getAllCourses)
courseRouter.get('/:id', requireAuth() , getCourseById)

export default courseRouter;