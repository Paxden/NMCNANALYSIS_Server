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

    programmeCode: String, // ✅ ADD
    programme: String,

    paper1: Number,
    paper2: Number,
    osce: Number,
    average: Number,

    grade: String,
    status: String,
  },
  { timestamps: true },
);

export default mongoose.model("Result", resultSchema);
