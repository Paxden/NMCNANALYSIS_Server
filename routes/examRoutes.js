import express from "express";
import upload from "../middleware/upload.js";
import {
  uploadExamResults,
  getUserExams,
  getExamById,
} from "../controllers/examController.js";
import { auth } from "../middleware/AuthMiddleware.js";

const router = express.Router();

// Get all exams for the user
router.get("/", getUserExams);

// Get single exam
router.get("/:id", getExamById);

router.post("/upload", auth, upload.single("file"), uploadExamResults);

export default router;
