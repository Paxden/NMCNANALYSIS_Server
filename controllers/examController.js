import Exam from "../models/Exam.js";
import Result from "../models/Result.js";
import { processCSV } from "../utilis/csvProcessor.js";



// Get all exams for the current user
export const getUserExams = async (req, res) => {
  try {
    const exams = await Exam.find({ 
      uploadedBy: req.session.userId 
    }).sort({ createdAt: -1 });
    
    console.log("Found exams:", exams);
    
    // ✅ Ensure each exam has an _id and format properly
    const formattedExams = exams.map(exam => ({
      _id: exam._id.toString(), // Convert ObjectId to string
      title: exam.title,
      createdAt: exam.createdAt,
      date: exam.date,
      uploadedBy: exam.uploadedBy,
      resultCount: 0 // You can calculate this if needed
    }));
    
    console.log("Formatted exams:", formattedExams);
    
    res.json({
      success: true,
      exams: formattedExams
    });
  } catch (error) {
    console.error("Get exams error:", error);
    res.status(500).json({ message: "Failed to fetch exams" });
  }
};

export const uploadExamResults = async (req, res) => {
  try {
    const { title } = req.body;

    const exam = await Exam.create({
      title,
      date: new Date(),
      uploadedBy: req.session.userId
    });

    console.log("✅ Created exam:", exam);
    console.log("✅ Exam ID:", exam._id.toString());

    const parsedResults = await processCSV(req.file.path);

    const resultsWithExam = parsedResults.map(r => ({
      ...r,
      examId: exam._id
    }));

    await Result.insertMany(resultsWithExam);

    // ✅ Return the exam ID explicitly
    res.json({
      message: "Results uploaded successfully",
      count: resultsWithExam.length,
      examId: exam._id.toString(), // Convert to string
      exam: {
        _id: exam._id.toString(),
        title: exam.title,
        createdAt: exam.createdAt
      }
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Upload failed" });
  }
};

// Get single exam by ID
export const getExamById = async (req, res) => {
  try {
    const exam = await Exam.findOne({
      _id: req.params.id,
      uploadedBy: req.session.userId,
    });

    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    res.json({
      success: true,
      exam: exam,
    });
  } catch (error) {
    console.error("Get exam error:", error);
    res.status(500).json({ message: "Failed to fetch exam" });
  }
};
