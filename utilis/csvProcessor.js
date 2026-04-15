import fs from "fs";
import csv from "csv-parser";

export const processCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];

    fs.createReadStream(filePath)
      .pipe(csv({ separator: "," })) // important safety
      .on("data", (data) => {
        let rawScore = data.score || data.Score;

        const score = Number(String(rawScore).trim());

        if (isNaN(score)) {
          console.warn("Invalid score skipped:", data);
          return;
        }

        // 🎯 FIXED FIELD MAPPING FOR YOUR CSV
        const candidateId = data.candidate_id?.trim();
        const candidateName = data.candidate_name?.trim();

        let grade = "F";
        if (score >= 70) grade = "A";
        else if (score >= 60) grade = "B";
        else if (score >= 50) grade = "C";
        else if (score >= 45) grade = "D";

        results.push({
          name: candidateName,          // ✅ FIXED
          regNumber: candidateId,       // ✅ FIXED (important!)
          school: data.school?.trim(),
          state: data.state?.trim(),
          centre: data.centre?.trim(),
          score,
          grade,
          status: score >= 50 ? "Pass" : "Fail",
        });
      })
      .on("end", () => resolve(results))
      .on("error", reject);
  });
};