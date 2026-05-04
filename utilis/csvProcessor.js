import fs from "fs";
import csv from "csv-parser";

const getProgrammeCode = (candidateId = "") => {
  return String(candidateId).split("/")[0].trim().toUpperCase();
};

const programmeMap = {
  GN: "GENERAL NURSING",
  FTN: "FTN",
  RN: "REFRESHER NURSING",
  CGN: "COMMUNITY GENERAL NURSING",
  AEN: "ACCIDENT & EMERGENCY NURSING",
  BPN: "BURNS & PLASTIC NURSING",
  CTN: "CARDIOTHORACIC NURSING",
  CCN: "CRITICAL CARE NURSING",
  DHN: "DENTAL HEALTH NURSING",
  MHN: "MENTAL HEALTH NURSING",
  NEN: "NEPHROLOGY NURSING",
  NAN: "NURSE ANAESTHESIA NURSING",
  OHN: "OCCUPATIONAL HEALTH NURSING",
  ONN: "ONCOLOGY NURSING",
  OPN: "OPHTHALMIC NURSING",
  ORN: "ORTHOPAEDIC NURSING",
  ENT: "ORTORHINOLARYNGOLOGY NURSING",
  PDN: "PAEDIATRICS NURSING",
  PON: "PERIOPERATIVE NURSING",
  PHN: "PUBLIC HEALTH NURSING",
  N: "GENERAL NURSING",
  NN: "NEONATAL NURSING",
  FTN: "FOREIGN TRAINED NURSING",
  DN: "DENTAL NURSING",
  OPN: "OPHTHALMIC NURSING",
  PHN: "PUBLIC HEALTH NURSING",
  CN: "COMMUNITY NURSING",
};

const fallbackProgrammes = [
  "GENERAL NURSING",
  "NEONATAL NURSING",
  "FOREIGN TRAINED NURSING",
  "DENTAL NURSING",
  "OPHTHALMIC NURSING",
  "PUBLIC HEALTH NURSING",
  "COMMUNITY NURSING",
];

const getRandomProgramme = () => {
  const index = Math.floor(Math.random() * fallbackProgrammes.length);
  return fallbackProgrammes[index];
};

export const processCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];

    fs.createReadStream(filePath)
      .pipe(csv({ mapHeaders: ({ header }) => header.trim() }))
      .on("data", (data) => {
        try {
          /** Candidate Info **/
          const candidateId =
            data.candidate_id?.trim() ||
            data.CandidateID?.trim() ||
            data["Candidate ID"]?.trim();

          const candidateName =
            data.candidate_name?.trim() ||
            data.CandidateName?.trim() ||
            data["Candidate Name"]?.trim();

          /** NEW FORMAT **/
          const paper1 = Number(data["Paper I (/100)"] || 0);
          const paper2 = Number(data["Paper II (/100)"] || 0);
          const osceNew = Number(data["OSCE (/100)"] || 0);

          /** OLD FORMAT FALLBACK **/
          const paperOld = Number(
            data.paper || data.Paper || data.paper_score || 0,
          );
          const osceOld = Number(
            data.osce || data.OSCE || data.osce_score || 0,
          );

          const useNewFormat = paper1 || paper2 || osceNew;

          const finalPaper1 = useNewFormat ? paper1 : paperOld;
          const finalPaper2 = useNewFormat ? paper2 : 0;
          const finalOsce = useNewFormat ? osceNew : osceOld;

          if (
            [finalPaper1, finalOsce].some((v) => isNaN(v)) ||
            (useNewFormat && isNaN(finalPaper2))
          ) {
            console.warn("Invalid row skipped:", data);
            return;
          }

          /** Average **/
          let average = Number(data["Average (%)"]);

          if (isNaN(average)) {
            average = useNewFormat
              ? Number(((finalPaper1 + finalPaper2 + finalOsce) / 3).toFixed(1))
              : Number(((finalPaper1 + finalOsce) / 2).toFixed(1));
          }

          /** Status **/
          const passMark = 50;

          const status = useNewFormat
            ? finalPaper1 < passMark ||
              finalPaper2 < passMark ||
              finalOsce < passMark
              ? "FAIL"
              : "PASS"
            : finalPaper1 < passMark || finalOsce < passMark
              ? "FAIL"
              : "PASS";

          /** Grade **/
          let grade = "F";
          if (average >= 70) grade = "A";
          else if (average >= 60) grade = "B";
          else if (average >= 50) grade = "C";
          else if (average >= 45) grade = "D";

          /** Programme **/
          const programmeCode = getProgrammeCode(candidateId);

          const programme = programmeMap[programmeCode] || getRandomProgramme();

          results.push({
            name: candidateName,
            regNumber: candidateId,
            programmeCode,
            programme,

            school: data.school?.trim() || data["School"]?.trim(),
            state: data.state?.trim() || data["State"]?.trim(),
            centre: data.centre?.trim() || data["Centre"]?.trim(),

            paper1: finalPaper1,
            paper2: finalPaper2,
            osce: finalOsce,
            average,

            grade,
            status,
          });
        } catch (err) {
          console.error("Row error:", err);
        }
      })
      .on("end", () => resolve(results))
      .on("error", reject);
  });
};
