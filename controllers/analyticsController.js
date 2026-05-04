import Result from "../models/Result.js";
import mongoose from "mongoose";

const toObjectId = (id) => new mongoose.Types.ObjectId(id);

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const PASS_MARK = 50;

// ==============================
// TOP CANDIDATES (GLOBAL)
// ==============================
export const getTopCandidates = async (req, res) => {
  try {
    const { examId, limit = 10 } = req.query;

    if (!examId || !isValidId(examId)) {
      return res.status(400).json({ message: "Valid examId is required" });
    }

    const top = await Result.find({
      examId: toObjectId(examId),
    })
      .sort({ average: -1 })
      .limit(Number(limit))
      .lean();

    res.json(top);
  } catch (err) {
    console.error("getTopCandidates error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ==============================
// SCORE DISTRIBUTION
// ==============================
export const getScoreDistribution = async (req, res) => {
  try {
    const { examId } = req.query;

    if (!examId || !isValidId(examId)) {
      return res.status(400).json({ message: "Valid examId is required" });
    }

    const distribution = await Result.aggregate([
      { $match: { examId: toObjectId(examId) } },
      {
        $bucket: {
          groupBy: "$average",
          boundaries: [0, 40, 50, 60, 70, 100],
          default: "Others",
          output: {
            count: { $sum: 1 },
          },
        },
      },
    ]);

    res.json(distribution);
  } catch (err) {
    console.error("getScoreDistribution error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ==============================
// DASHBOARD STATS
// ==============================
export const getDashboardStats = async (req, res) => {
  try {
    const { examId } = req.query;

    if (!examId || !isValidId(examId)) {
      return res.status(400).json({ message: "Valid examId is required" });
    }

    const match = { examId: toObjectId(examId) };

    const stats = await Result.aggregate([
      { $match: match },

      {
        $group: {
          _id: null,
          totalCandidates: { $sum: 1 },
          avgScore: { $avg: "$average" },
          maxScore: { $max: "$average" },
          minScore: { $min: "$average" },

          passCount: {
            $sum: {
              $cond: [{ $eq: [{ $toUpper: "$status" }, "PASS"] }, 1, 0],
            },
          },
        },
      },
    ]);

    const base = stats[0] || {
      totalCandidates: 0,
      avgScore: 0,
      maxScore: 0,
      minScore: 0,
      passCount: 0,
    };

    const failCount = base.totalCandidates - base.passCount;

    res.json({
      ...base,
      avgScore: Number((base.avgScore || 0).toFixed(2)),
      failCount,
    });
  } catch (err) {
    console.error("dashboard error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ==============================
// COMPARE EXAMS
// ==============================
export const compareExams = async (req, res) => {
  try {
    const { examIds } = req.body;

    if (!examIds || examIds.length < 2) {
      return res.status(400).json({
        message: "Provide at least 2 examIds",
      });
    }

    const results = await Result.find({
      examId: { $in: examIds.map(toObjectId) },
    });

    const examMap = {};

    results.forEach((r) => {
      const id = r.examId.toString();

      if (!examMap[id]) {
        examMap[id] = {
          total: 0,
          pass: 0,
          fail: 0,
          scores: [],
        };
      }

      examMap[id].total += 1;
      examMap[id].scores.push(r.average);

      if (r.status?.toUpperCase() === "PASS") examMap[id].pass += 1;
      else examMap[id].fail += 1;
    });

    const comparison = Object.entries(examMap).map(([examId, data]) => {
      const avg = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;

      return {
        examId,
        totalCandidates: data.total,
        avgScore: Number(avg.toFixed(2)),
        passRate: Number(((data.pass / data.total) * 100).toFixed(2)),
      };
    });

    res.json({ comparison });
  } catch (err) {
    console.error("compareExams error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ==============================
// SCORE BAND ANALYSIS (CORRECTED)
// ==============================
export const getScoreBandAnalysis = async (req, res) => {
  try {
    const { examId } = req.query;

    if (!examId || !isValidId(examId)) {
      return res.status(400).json({ message: "Valid examId is required" });
    }

    const bands = await Result.aggregate([
      { $match: { examId: toObjectId(examId) } },

      {
        $project: {
          score: "$average",
        },
      },

      {
        $bucket: {
          groupBy: "$score",
          boundaries: [0, 50, 60, 70, 101],
          default: "others",
          output: {
            count: { $sum: 1 },
          },
        },
      },
    ]);

    let result = {
      fail: 0,
      pass: 0,
      credit: 0,
      distinction: 0,
    };

    bands.forEach((b) => {
      if (b._id === 0) result.fail = b.count;
      if (b._id === 50) result.pass = b.count;
      if (b._id === 60) result.credit = b.count;
      if (b._id === 70) result.distinction = b.count;
    });

    const total =
      result.fail + result.pass + result.credit + result.distinction;

    res.json({
      total,
      bands: result,
      percentages: {
        fail: total ? ((result.fail / total) * 100).toFixed(2) : 0,
        pass: total ? ((result.pass / total) * 100).toFixed(2) : 0,
        credit: total ? ((result.credit / total) * 100).toFixed(2) : 0,
        distinction: total
          ? ((result.distinction / total) * 100).toFixed(2)
          : 0,
      },
    });
  } catch (err) {
    console.error("Score band error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Helper function to get the highest band
const getHighestBand = (bands) => {
  if (bands.distinction > 0) return "Distinction";
  if (bands.credit > 0) return "Credit";
  if (bands.pass > 0) return "Pass";
  return "Fail";
};

export const getProgrammeAnalytics = async (req, res) => {
  try {
    const { examId } = req.query;

    if (!examId || !mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({ message: "Valid examId is required" });
    }

    const match = { examId: toObjectId(examId) };

    const total = await Result.countDocuments(match);

    const programmes = await Result.aggregate([
      { $match: match },

      {
        $group: {
          _id: "$programme",
          count: { $sum: 1 },
          avgScore: { $avg: "$average" },

          // ✅ count PASS
          passCount: {
            $sum: {
              $cond: [{ $eq: [{ $toUpper: "$status" }, "PASS"] }, 1, 0],
            },
          },
        },
      },

      {
        $addFields: {
          // ✅ pass rate %
          passRate: {
            $multiply: [{ $divide: ["$passCount", "$count"] }, 100],
          },
        },
      },

      { $sort: { count: -1 } },

      {
        $project: {
          _id: 0,
          programme: "$_id",
          count: 1,

          avgScore: { $round: ["$avgScore", 2] },
          passRate: { $round: ["$passRate", 2] },

          percentage: {
            $round: [{ $multiply: [{ $divide: ["$count", total] }, 100] }, 2],
          },
        },
      },
    ]);

    // 🔎 UNKNOWN %
    const unknown = programmes.find((p) => p.programme === "UNKNOWN PROGRAMME");

    const unknownPercentage = unknown ? unknown.percentage : 0;

    res.json({
      total,
      unknownPercentage,
      programmes,
    });
  } catch (err) {
    console.error("getProgrammeAnalytics error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ==============================
// TOP SCHOOLS
// ==========================
export const getTopSchools = async (req, res) => {
  try {
    const { examId } = req.query;

    if (!examId || !isValidId(examId)) {
      return res.status(400).json({ message: "Valid examId is required" });
    }

    const schools = await Result.aggregate([
      { $match: { examId: toObjectId(examId) } },

      {
        $group: {
          _id: "$school",
          avgScore: { $avg: "$average" },
          totalStudents: { $sum: 1 },
        },
      },

      { $sort: { avgScore: -1 } },
      { $limit: 10 },

      {
        $project: {
          _id: 0,
          school: "$_id",
          avgScore: { $round: ["$avgScore", 2] },
          totalStudents: 1,
        },
      },
    ]);

    res.json({ data: schools });
  } catch (err) {
    console.error("getTopSchools error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const getScoreTrend = async (req, res) => {
  try {
    const { examId } = req.query;

    if (!examId || !mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({ message: "Valid examId is required" });
    }

    const trend = await Result.aggregate([
      {
        $match: {
          examId: new mongoose.Types.ObjectId(examId),
        },
      },

      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },
          averageScore: { $avg: "$average" },
          count: { $sum: 1 },
        },
      },

      {
        $sort: { _id: 1 },
      },

      {
        $project: {
          _id: 0,
          date: "$_id",
          averageScore: { $round: ["$averageScore", 2] },
          count: 1,
        },
      },
    ]);

    res.json({ data: trend });
  } catch (error) {
    console.error("score trend error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getTop10Schools = async (req, res) => {
  try {
    const { examId, limit = 10 } = req.query;

    // ✅ Validate examId
    if (!examId || !mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({
        message: "Valid examId is required",
      });
    }

    const match = { examId: toObjectId(examId) };

    // 🔢 Total students (for percentage share if needed)
    const totalStudents = await Result.countDocuments(match);

    const schools = await Result.aggregate([
      { $match: match },

      {
        $group: {
          _id: "$school",
          avgScore: { $avg: "$average" },
          totalStudents: { $sum: 1 },

          passCount: {
            $sum: {
              $cond: [{ $eq: [{ $toUpper: "$status" }, "PASS"] }, 1, 0],
            },
          },
        },
      },

      {
        $addFields: {
          passRate: {
            $multiply: [{ $divide: ["$passCount", "$totalStudents"] }, 100],
          },

          // Optional: % contribution to total candidates
          percentage: {
            $multiply: [{ $divide: ["$totalStudents", totalStudents] }, 100],
          },
        },
      },

      { $sort: { avgScore: -1 } },
      { $limit: Number(limit) },

      {
        $project: {
          _id: 0,
          school: "$_id",
          avgScore: { $round: ["$avgScore", 2] },
          totalStudents: 1,
          passRate: { $round: ["$passRate", 2] },
          percentage: { $round: ["$percentage", 2] }, // optional but useful
        },
      },
    ]);

    res.json({
      data: schools,
      meta: {
        totalSchools: schools.length,
        totalCandidates: totalStudents,
      },
    });
  } catch (err) {
    console.error("getTop10Schools error:", err);
    res.status(500).json({
      message: "Failed to fetch top schools",
      error: err.message,
    });
  }
};

// School details
export const getSchoolDetails = async (req, res) => {
  try {
    const { examId, school } = req.query;

    if (!examId || !school) {
      return res.status(400).json({ message: "Missing params" });
    }

    const data = await Result.aggregate([
      {
        $match: {
          examId: toObjectId(examId),
          school: school,
        },
      },

      {
        $group: {
          _id: "$school",
          state: { $first: "$state" },

          totalCandidates: { $sum: 1 },

          passCount: {
            $sum: {
              $cond: [{ $eq: [{ $toUpper: "$status" }, "PASS"] }, 1, 0],
            },
          },
        },
      },

      {
        $addFields: {
          failCount: {
            $subtract: ["$totalCandidates", "$passCount"],
          },
          passRate: {
            $multiply: [{ $divide: ["$passCount", "$totalCandidates"] }, 100],
          },
        },
      },

      {
        $project: {
          _id: 0,
          school: "$_id",
          state: 1,
          totalCandidates: 1,
          passCount: 1,
          failCount: 1,
          passRate: { $round: ["$passRate", 2] },
        },
      },
    ]);

    res.json(data[0] || {});
  } catch (err) {
    console.error("school details error:", err);
    res.status(500).json({ message: err.message });
  }
};

// program details
export const getProgrammeDetails = async (req, res) => {
  try {
    const { examId, programme } = req.query;

    if (!examId || !programme) {
      return res.status(400).json({ message: "Missing params" });
    }

    const data = await Result.aggregate([
      {
        $match: {
          examId: toObjectId(examId),
          programme: programme,
        },
      },

      {
        $group: {
          _id: "$programme",

          totalCandidates: { $sum: 1 },

          avgScore: { $avg: "$average" },

          passCount: {
            $sum: {
              $cond: [
                { $eq: [{ $toUpper: "$status" }, "PASS"] },
                1,
                0,
              ],
            },
          },
        },
      },

      {
        $addFields: {
          failCount: {
            $subtract: ["$totalCandidates", "$passCount"],
          },
          passRate: {
            $multiply: [
              { $divide: ["$passCount", "$totalCandidates"] },
              100,
            ],
          },
        },
      },

      {
        $project: {
          _id: 0,
          programme: "$_id",
          totalCandidates: 1,
          passCount: 1,
          failCount: 1,
          avgScore: { $round: ["$avgScore", 2] },
          passRate: { $round: ["$passRate", 2] },
        },
      },
    ]);

    res.json(data[0] || {});
  } catch (err) {
    console.error("programme details error:", err);
    res.status(500).json({ message: err.message });
  }
};
