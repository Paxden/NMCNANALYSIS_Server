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
import { protect } from "../middleware/AuthMiddleware.js";

const router = express.Router();

router.use(protect); // 🔥 protect ALL analytics routes

router.get("/stats", getDashboardStats);
router.get("/top-candidates", getTopCandidates);
router.get("/top-schools", getTopSchools);
router.get("/states", getStatePerformance);
router.get("/centres", getTopCentres);
router.get("/distribution", getScoreDistribution);

router.get("/score-trend", async (req, res) => {
  try {
    const { examId } = req.query;

    const submissions = await Submission.find({ examId }).sort({
      createdAt: 1,
    });

    // Group by date or week
    const trendData = [];
    const weekSize = 7;

    for (let i = 0; i < submissions.length; i += weekSize) {
      const weekSubmissions = submissions.slice(i, i + weekSize);
      const avgScore =
        weekSubmissions.reduce((sum, sub) => sum + sub.score, 0) /
        weekSubmissions.length;

      trendData.push({
        period: `Week ${Math.floor(i / weekSize) + 1}`,
        averageScore: avgScore,
        count: weekSubmissions.length,
        startDate: weekSubmissions[0]?.createdAt,
        endDate: weekSubmissions[weekSubmissions.length - 1]?.createdAt,
      });
    }

    res.json({ data: trendData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/compare", compareExams);
export default router;
