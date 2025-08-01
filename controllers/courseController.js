import Course from "../models/Course.js";

// Get All Courses
export const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find({ isPublished: true })
      .select(["-courseContent", "-enrolledStudents"])
      .populate({ path: "educator" });

    res.status(200).json({ success: true, courses });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Error fetching all Courses data: ${error.message}`,
    });
  }
};

// Get course by id
export const getCourseById = async (req, res) => {
  const { id } = req.params;

  try {
    const courseData = await Course.findById(id).populate({ path: "educator" });

    // Remove lecture url if preview is false
    courseData.courseContent.forEach((chapter) => {
      chapter.chapterContent.forEach((lecture) => {
        if (!lecture.isPreviewFree) {
          lecture.lectureUrl = "";
        }
      });
    });

    res.status(200).json({ success: true, courseData });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Error fetching Course by id: ${error.message}`,
    });
  }
};
