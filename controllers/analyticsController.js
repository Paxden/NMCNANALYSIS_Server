import Result from "../models/Result.js";
import mongoose from "mongoose";

export const getTopCandidates = async (req, res) => {
  try {
    const { examId, limit = 10 } = req.query;

    // Validate examId
    if (!examId || !mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({ message: "Valid examId is required" });
    }

    const top = await Result.find({
      examId: new mongoose.Types.ObjectId(examId),
    })
      .sort({ score: -1 })
      .limit(Number(limit))
      .lean(); // Use lean() for better performance

    res.json(top);
  } catch (err) {
    console.error("Error in getTopCandidates:", err);
    res
      .status(500)
      .json({ message: "Failed to fetch top candidates", error: err.message });
  }
};

export const getTopSchools = async (req, res) => {
  try {
    const { examId } = req.query;

    // Validate examId
    if (!examId || !mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({ message: "Valid examId is required" });
    }

    const schools = await Result.aggregate([
      { $match: { examId: new mongoose.Types.ObjectId(examId) } },
      {
        $group: {
          _id: "$school",
          avgScore: { $avg: "$score" },
          totalStudents: { $sum: 1 },
        },
      },
      { $sort: { avgScore: -1 } },
      { $limit: 10 },
    ]);

    res.json(schools);
  } catch (err) {
    console.error("Error in getTopSchools:", err);
    res
      .status(500)
      .json({ message: "Failed to fetch schools", error: err.message });
  }
};

export const getStatePerformance = async (req, res) => {
  try {
    const { examId } = req.query;

    // Validate examId
    if (!examId || !mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({ message: "Valid examId is required" });
    }

    const states = await Result.aggregate([
      { $match: { examId: new mongoose.Types.ObjectId(examId) } },
      {
        $group: {
          _id: "$state",
          total: { $sum: 1 },
          pass: {
            $sum: { $cond: [{ $eq: ["$status", "Pass"] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          state: "$_id",
          passRate: {
            $multiply: [{ $divide: ["$pass", { $max: ["$total", 1] }] }, 100], // Avoid division by zero
          },
          total: 1,
          passed: "$pass",
        },
      },
      { $sort: { passRate: -1 } },
    ]);

    res.json(states);
  } catch (err) {
    console.error("Error in getStatePerformance:", err);
    res.status(500).json({
      message: "Failed to fetch state performance",
      error: err.message,
    });
  }
};

export const getTopCentres = async (req, res) => {
  try {
    const { examId } = req.query;

    // Validate examId
    if (!examId || !mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({ message: "Valid examId is required" });
    }

    const centres = await Result.aggregate([
      { $match: { examId: new mongoose.Types.ObjectId(examId) } },
      {
        $group: {
          _id: "$centre",
          avgScore: { $avg: "$score" },
          total: { $sum: 1 },
        },
      },
      { $sort: { avgScore: -1 } },
      { $limit: 10 },
    ]);

    res.json(centres);
  } catch (err) {
    console.error("Error in getTopCentres:", err);
    res
      .status(500)
      .json({ message: "Failed to fetch centres", error: err.message });
  }
};

export const getScoreDistribution = async (req, res) => {
  try {
    const { examId } = req.query;

    // Validate examId
    if (!examId || !mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({ message: "Valid examId is required" });
    }

    const distribution = await Result.aggregate([
      { $match: { examId: new mongoose.Types.ObjectId(examId) } },
      {
        $bucket: {
          groupBy: "$score",
          boundaries: [0, 40, 50, 60, 70, 100],
          default: "Others",
          output: {
            count: { $sum: 1 },
          },
        },
      },
    ]);

    // Format the response to make it more readable
    const formattedDistribution = distribution.map((item) => ({
      range:
        item._id === "Others"
          ? "Others"
          : `${item._id}-${item._id === 70 ? 100 : item._id === 0 ? 40 : item._id === 40 ? 50 : item._id === 50 ? 60 : 70}`,
      count: item.count,
      minScore: item._id === "Others" ? null : item._id,
      maxScore:
        item._id === "Others"
          ? null
          : item._id === 70
            ? 100
            : item._id === 0
              ? 40
              : item._id === 40
                ? 50
                : item._id === 50
                  ? 60
                  : 70,
    }));

    res.json(formattedDistribution);
  } catch (err) {
    console.error("Error in getScoreDistribution:", err);
    res
      .status(500)
      .json({ message: "Failed to fetch distribution", error: err.message });
  }
};

// ==============================
// UTILITY
// ==============================
const toObjectId = (id) => new mongoose.Types.ObjectId(id);

// ==============================
// MAIN DASHBOARD STATS
// ==============================
export const getDashboardStats = async (req, res) => {
  try {
    const { examId } = req.query;

    if (!examId || !mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({ message: "Valid examId is required" });
    }

    const match = { examId: toObjectId(examId) };

    const results = await Result.find(match);

    if (!results.length) {
      return res.json({
        totalCandidates: 0,
        avgScore: 0,
        maxScore: 0,
        minScore: 0,
        passCount: 0,
        failCount: 0,
        scoreDistribution: [],
        topStates: [],
        topSchools: [],
        topCandidates: [],
      });
    }

    // ==============================
    // BASIC STATS
    // ==============================
    const totalCandidates = results.length;

    const scores = results.map((r) => r.score);

    const avgScore = scores.reduce((a, b) => a + b, 0) / totalCandidates;

    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);

    const passCount = results.filter((r) => r.status === "Pass").length;
    const failCount = totalCandidates - passCount;

    // ==============================
    // SCORE DISTRIBUTION
    // ==============================
    const distribution = {
      "0-49": 0,
      "50-59": 0,
      "60-69": 0,
      "70-100": 0,
    };

    results.forEach((r) => {
      if (r.score < 50) distribution["0-49"]++;
      else if (r.score < 60) distribution["50-59"]++;
      else if (r.score < 70) distribution["60-69"]++;
      else distribution["70-100"]++;
    });

    const scoreDistribution = Object.keys(distribution).map((key) => ({
      range: key,
      count: distribution[key],
    }));

    // ==============================
    // TOP CANDIDATES
    // ==============================
    const topCandidates = results
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((r) => ({
        name: r.name,
        regNumber: r.regNumber,
        score: r.score,
      }));

    // ==============================
    // TOP SCHOOLS
    // ==============================
    const schoolMap = {};

    results.forEach((r) => {
      if (!schoolMap[r.school]) {
        schoolMap[r.school] = {
          total: 0,
          count: 0,
        };
      }

      schoolMap[r.school].total += r.score;
      schoolMap[r.school].count += 1;
    });

    const topSchools = Object.entries(schoolMap)
      .map(([school, data]) => ({
        school,
        avgScore: (data.total / data.count).toFixed(2),
      }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 10);

    // ==============================
    // TOP STATES (PASS RATE)
    // ==============================
    const stateMap = {};

    results.forEach((r) => {
      if (!stateMap[r.state]) {
        stateMap[r.state] = { pass: 0, total: 0 };
      }

      stateMap[r.state].total += 1;
      if (r.status === "Pass") stateMap[r.state].pass += 1;
    });

    const topStates = Object.entries(stateMap)
      .map(([state, data]) => ({
        state,
        passRate: ((data.pass / data.total) * 100).toFixed(2),
      }))
      .sort((a, b) => b.passRate - a.passRate)
      .slice(0, 10);

    // ==============================
    // RESPONSE
    // ==============================
    res.json({
      totalCandidates,
      avgScore,
      maxScore,
      minScore,
      passCount,
      failCount,
      scoreDistribution,
      topCandidates,
      topSchools,
      topStates,
    });
  } catch (err) {
    console.error("❌ ANALYTICS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// ==============================
// MULTI EXAM COMPARISON
// ==============================
export const compareExams = async (req, res) => {
  try {
    const { examIds } = req.body;

    if (!examIds || !Array.isArray(examIds) || examIds.length < 2) {
      return res.status(400).json({
        message: "Provide at least 2 examIds in an array",
      });
    }

    const objectIds = examIds.map((id) => toObjectId(id));

    const results = await Result.find({
      examId: { $in: objectIds },
    });

    // ==============================
    // GROUP BY EXAM
    // ==============================
    const examMap = {};

    results.forEach((r) => {
      const id = r.examId.toString();

      if (!examMap[id]) {
        examMap[id] = {
          examId: id,
          total: 0,
          pass: 0,
          fail: 0,
          scores: [],
        };
      }

      examMap[id].total += 1;
      examMap[id].scores.push(r.score);

      if (r.status === "Pass") examMap[id].pass += 1;
      else examMap[id].fail += 1;
    });

    // ==============================
    // FORMAT RESPONSE
    // ==============================
    const comparison = Object.values(examMap).map((exam) => {
      const avg = exam.scores.reduce((a, b) => a + b, 0) / exam.total;

      const passRate = (exam.pass / exam.total) * 100;

      return {
        examId: exam.examId,
        totalCandidates: exam.total,
        avgScore: Number(avg.toFixed(2)),
        passRate: Number(passRate.toFixed(2)),
        passCount: exam.pass,
        failCount: exam.fail,
      };
    });

    res.json({
      comparison,
    });
  } catch (err) {
    console.error("❌ COMPARE ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};
