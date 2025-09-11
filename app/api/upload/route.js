import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import dbConnect from '@/lib/dbConnect';
import Question from '../../models/question'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Handles POST requests to create a new question.
 */
export async function POST(req) {
  // Connect to the database
  await dbConnect();

  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const type = formData.get('type');
    const question = formData.get('question');
    const options = JSON.parse(formData.get('options') || '[]');
    const correctAnswer = parseInt(formData.get('correctAnswer'), 10);

    let mediaUrl = null;

    // Upload file to Cloudinary if provided
    if (file && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const uploadRes = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            { folder: 'quiz_uploads', resource_type: 'auto' },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          )
          .end(buffer);
      });

      mediaUrl = uploadRes.secure_url;
    }

    // Create a new question document with the data and the file URL
    const newQuestion = new Question({
      type,
      question,
      options,
      correctAnswer,
      mediaUrl,
    });

    // Save the new question to the database
    await newQuestion.save();

    // Return a success response
    return NextResponse.json({
      message: 'Question submitted successfully!',
      question: newQuestion,
    }, { status: 201 });

  } catch (error) {
    console.error('Error saving question:', error);
    return NextResponse.json({ error: 'Failed to submit question.' }, { status: 500 });
  }
}

/**
 * Handles GET requests to fetch all questions from the database.
 */
export async function GET() {
  await dbConnect();

  try {
    const questions = await Question.find({});
    return NextResponse.json(questions, { status: 200 });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({ error: 'Failed to fetch questions.' }, { status: 500 });
  }
}
