import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
  },
  question: {
    type: String,
    required: true,
  },
  options: {
    type: [String],
    required: true,
  },
  correctAnswer: {
    type: Number,
    required: true,
  },
  mediaUrl: {
    type: String,
    required: false,
  },
}, { timestamps: true });

const Question = mongoose.models.Question || mongoose.model('Question', QuestionSchema);

export default Question;
