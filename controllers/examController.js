import Exam from "../models/Exam.js";
import Result from "../models/Result.js";
import { processCSV } from "../utilis/csvProcessor.js";

import fs from "fs";

// Get all exams for the current user
export const getUserExams = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const exams = await Exam.find({
      uploadedBy: req.user.id,
    }).sort({ createdAt: -1 });

    const formattedExams = await Promise.all(
      exams.map(async (exam) => {
        const count = await Result.countDocuments({
          examId: exam._id,
        });

        return {
          _id: exam._id.toString(),
          title: exam.title,
          createdAt: exam.createdAt,
          date: exam.date,
          resultCount: count,
        };
      }),
    );

    res.json({
      success: true,
      exams: formattedExams,
    });
  } catch (error) {
    console.error("Get exams error:", error);
    res.status(500).json({ message: "Failed to fetch exams" });
  }
};

export const uploadExamResults = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "CSV file is required" });
    }

    const exam = await Exam.create({
      title,
      date: new Date(),
      uploadedBy: req.user.id,
    });

    const parsedResults = await processCSV(req.file.path);

    if (!parsedResults.length) {
      return res.status(400).json({
        message: "No valid results found in CSV",
      });
    }

    const resultsWithExam = parsedResults.map((r) => ({
      ...r,
      examId: exam._id,
    }));

    await Result.insertMany(resultsWithExam);

    // cleanup file
    fs.unlinkSync(req.file.path);

    res.json({
      message: "Results uploaded successfully",
      count: resultsWithExam.length,
      examId: exam._id.toString(),
      exam: {
        _id: exam._id.toString(),
        title: exam.title,
        createdAt: exam.createdAt,
      },
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
      uploadedBy: req.user.id,
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
