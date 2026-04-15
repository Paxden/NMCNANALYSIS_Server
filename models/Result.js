import mongoose from "mongoose";

const resultSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
    },
    name: String,
    regNumber: String,
    school: String,
    state: String,
    centre: String,
    score: Number,
    grade: String,
    status: String,
  },
  { timestamps: true },
);

export default mongoose.model("Result", resultSchema);
