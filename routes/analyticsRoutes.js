import express from "express";
import {
  getDashboardStats,
  getTopCandidates,
  getTopSchools,
  getStatePerformance,
  getTopCentres,
  getScoreDistribution,
  compareExams,
} from "../controllers/analyticsController.js";
import { auth } from "../middleware/AuthMiddleware.js";

const router = express.Router();

router.use(auth); // 🔥 protect ALL analytics routes

router.get("/stats", getDashboardStats);
router.get("/top-candidates", getTopCandidates);
router.get("/top-schools", getTopSchools);
router.get("/states", getStatePerformance);
router.get("/centres", getTopCentres);
router.get("/distribution", getScoreDistribution);

router.post("/compare", compareExams);
export default router;
