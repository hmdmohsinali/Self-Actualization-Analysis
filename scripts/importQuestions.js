import fs from "fs";
import csv from "csv-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Question from "../src/models/Questions.js"; // adjust if needed

dotenv.config();

async function connectDB() {
  try {
    console.log("🟡 Connecting to MongoDB...");
    const uri =
      process.env.MONGO_URI ||
      "mongodb+srv://ma7260712_db_user:jVOzoHihPmoxdITQ@cluster0.psuigku.mongodb.net/?appName=Cluster0";
    console.log("🔗 Using URI:", uri ? "Loaded successfully" : "Missing");
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
}

async function importQuestions() {
  const results = [];
  const csvPath = "./Questions.csv";
  console.log(`📂 Reading file: ${csvPath}`);

  if (!fs.existsSync(csvPath)) {
    console.error("❌ CSV file not found:", csvPath);
    process.exit(1);
  }

  fs.createReadStream(csvPath)
    .pipe(csv())
    .on("data", (row) => results.push(row))
    .on("end", async () => {
      console.log(`📊 Parsed ${results.length} rows`);
      console.log("🔍 Sample keys:", Object.keys(results[0] || {}));

      try {
        const formattedQuestions = results.map((q, idx) => ({
          questionText: q["Question"] || q["﻿Question"], // handle BOM
          answerOptions: q["Answer Options"]
            ? q["Answer Options"].split("|").map((opt) => opt.trim())
            : [],
          correctAnswer: q["Correct Answer"] || null,
          pointValue: Number(q["Point Value"]) || 0,
          category: q["Category"]?.trim(),
          questionType:
            q["Question Type"] || "Multiple Choice - Horizontal",
        }));

        const invalids = formattedQuestions.filter((q) => !q.questionText);
        if (invalids.length) {
          console.warn(
            `⚠️ ${invalids.length} questions missing "Question" field. Skipping...`
          );
        }

        const validQuestions = formattedQuestions.filter(
          (q) => q.questionText && q.category
        );

        console.log(`🧩 Inserting ${validQuestions.length} valid questions...`);
        await Question.insertMany(validQuestions);
        console.log(`✅ Successfully inserted ${validQuestions.length} questions`);
      } catch (err) {
        console.error("❌ Error inserting questions:", err);
      } finally {
        await mongoose.connection.close();
        console.log("🔒 MongoDB connection closed");
      }
    });
}

await connectDB();
await importQuestions();
