import express from "express";
import {
  getDashboardStats,
  getTopCandidates,
  getTopSchools,
  getTop10Schools,
  // getTopCandidatesBySchool,
  getScoreDistribution,
  compareExams,
  getScoreBandAnalysis,
  getProgrammeAnalytics,
  getSchoolDetails,
  getProgrammeDetails,
  getScoreTrend, 
  // ✅ move logic to controller
} from "../controllers/analyticsController.js";

import { protect } from "../middleware/AuthMiddleware.js";

const router = express.Router();

// 🔐 Protect all routes
router.use(protect);

// ==============================
// 📊 CORE DASHBOARD
// ==============================
router.get("/stats", getDashboardStats);
router.get("/distribution", getScoreDistribution);
router.get("/score-bands", getScoreBandAnalysis);

// ==============================
// 🏆 PERFORMANCE
// ==============================
router.get("/top-candidates", getTopCandidates);
// router.get("/top-candidates-by-school", getTopCandidatesBySchool);

router.get("/top-schools", getTopSchools);      // avg score ranking
router.get("/top-10-schools", getTop10Schools);   // top 10 schools
router.get("/school-details", getSchoolDetails); // individual school details

// ==============================
// 📘 PROGRAMMES
// ==============================
router.get("/programme-analytics", getProgrammeAnalytics);
router.get("/programme-details", getProgrammeDetails);
// ==============================
// 📈 TRENDS
// ==============================
router.get("/score-trend", getScoreTrend);

// ==============================
// 🔄 COMPARISON
// ==============================
router.post("/compare", compareExams);

export default router;