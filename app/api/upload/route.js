import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import dbConnect from "@/lib/dbConnect";
import Question from "../../models/question";
import { verifyToken } from "@/lib/auth";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * POST → Create a new question (Admin only)
 */
export async function POST(req) {
  await dbConnect();

  // 🔐 Verify JWT
  const user = verifyToken(req);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const type = formData.get("type");
    const question = formData.get("question");
    const options = JSON.parse(formData.get("options") || "[]");
    const correctAnswer = parseInt(formData.get("correctAnswer"), 10);

    let mediaUrl = null;
    let cloudinaryId = null;

    // 📤 Upload file to Cloudinary if provided
    if (file && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const uploadRes = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            { folder: "quiz_uploads", resource_type: "auto" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          )
          .end(buffer);
      });

      mediaUrl = uploadRes.secure_url;
      cloudinaryId = uploadRes.public_id; // 👈 store public_id for reference
    }

    // Save question in DB
    const newQuestion = new Question({
      type,
      question,
      options,
      correctAnswer,
      mediaUrl,
      cloudinaryId,
    });

    await newQuestion.save();

    return NextResponse.json(
      { message: "Question submitted successfully!", question: newQuestion },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error saving question:", error);
    return NextResponse.json(
      { error: "Failed to submit question." },
      { status: 500 }
    );
  }
}

/**
 * GET → Fetch all questions (Admin only)
 */
export async function GET(req) {
  await dbConnect();

  // 🔐 Verify JWT
  const user = verifyToken(req);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const questions = await Question.find({});
    return NextResponse.json(questions, { status: 200 });
  } catch (error) {
    console.error("Error fetching questions:", error);
    return NextResponse.json(
      { error: "Failed to fetch questions." },
      { status: 500 }
    );
  }
}

/**
 * DELETE → Remove a question by ID (Admin only, without deleting from Cloudinary)
 */
export async function DELETE(req) {
  await dbConnect();

  // 🔐 Verify JWT
  const user = verifyToken(req);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Question ID is required" },
        { status: 400 }
      );
    }

    const question = await Question.findByIdAndDelete(id);

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    // ❌ Skip Cloudinary deletion
    // if (question.cloudinaryId) {
    //   await cloudinary.uploader.destroy(question.cloudinaryId);
    // }

    return NextResponse.json(
      { message: "Question deleted successfully!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting question:", error);
    return NextResponse.json(
      { error: "Failed to delete question." },
      { status: 500 }
    );
  }
}
