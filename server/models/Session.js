const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Interview config
  role: { type: String, required: true },
  company: { type: String, default: 'General' },
  level: { type: String, default: 'Mid' },
  persona: {
    type: String,
    enum: ['friendly', 'aggressive', 'silent'],
    default: 'friendly'
  },

  // Q&A pairs — one object per question answered
  answers: [
    {
      question: String,
      transcript: String,
      duration: Number,
      starBreakdown: {
        situation: Boolean,
        task: Boolean,
        action: Boolean,
        result: Boolean
      }
    }
  ],

  // AI debrief report
  report: {
    confidenceScore: Number,
    fillerCount: Number,
    bestSentence: String,
    weakestPoint: String,
    tips: [String],
    resumeGaps: [String]
  },

  isPublic: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Session', sessionSchema);