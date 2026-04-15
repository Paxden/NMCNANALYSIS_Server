import Result from "../models/Result.js";
import mongoose from "mongoose";

const toObjectId = (id) => new mongoose.Types.ObjectId(id);

export const getResults = async (req, res) => {
  try {
    const {
      examId,
      page = 1,
      limit = 20,
      search = "",
      state,
      school,
      centre,
      status,
      minScore,
      maxScore,
      sortBy = "score",
      order = "desc",
    } = req.query;

    // ✅ Validate examId
    if (!examId || !mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({ message: "Valid examId is required" });
    }

    // 🧱 Build filter query
    const query = {
      examId: toObjectId(examId),
    };

    // 🔍 Search (name or reg number)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { regNumber: { $regex: search, $options: "i" } },
      ];
    }

    // 🎯 Filters
    if (state) query.state = state;
    if (school) query.school = school;
    if (centre) query.centre = centre;
    if (status) query.status = status;

    // 📊 Score range
    if (minScore || maxScore) {
      query.score = {};
      if (minScore) query.score.$gte = Number(minScore);
      if (maxScore) query.score.$lte = Number(maxScore);
    }

    // 🔢 Pagination
    const skip = (Number(page) - 1) * Number(limit);

    // 🔀 Sorting
    const sortOrder = order === "asc" ? 1 : -1;

    // ⚡ Execute queries in parallel
    const [results, total] = await Promise.all([
      Result.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(Number(limit)),

      Result.countDocuments(query),
    ]);

    res.json({
      data: results,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("❌ RESULTS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};
