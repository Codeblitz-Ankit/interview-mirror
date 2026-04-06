const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Session = require('../models/Session');
const { askGemini, askGeminiJSON } = require('../config/gemini');

// POST /api/session/questions
// Generate interview questions based on role, company, level, persona
router.post('/questions', protect, async (req, res) => {
  try {
    const { role, company, level, persona } = req.body;

    const personaInstructions = {
      friendly: 'You are a warm and encouraging interviewer.',
      aggressive: 'You are a tough interviewer who asks challenging questions.',
      silent: 'You are a quiet interviewer who asks direct, short questions.'
    };

    const prompt = `${personaInstructions[persona] || personaInstructions.friendly}

Generate 5 interview questions for a ${role} role at ${company} company, ${level} level.
Return ONLY a JSON array of 5 strings. No explanation, no extra text.
Example: ["Question 1?", "Question 2?", "Question 3?", "Question 4?", "Question 5?"]`;

    const questions = await askGeminiJSON(prompt);
    res.json({ questions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/session/analyze-star
// Analyze answer based on STAR framework
router.post('/analyze-star', protect, async (req, res) => {
  try {
    const { question, answer } = req.body;
    
    // Fetch user to get their resume claims
    const user = await User.findById(req.user._id);
    const resumeContext = user.resumeClaims && user.resumeClaims.length > 0 
      ? `User's Resume Claims: ${user.resumeClaims.join(', ')}`
      : "No resume provided.";

    if (!answer || answer.length < 10) {
      return res.json({ analysis: "Answer too short for analysis." });
    }

    const prompt = `
      You are an expert interview coach. Analyze the following answer based on the STAR framework (Situation, Task, Action, Result).
      
      CONTEXT:
      Question: "${question}"
      User's Spoken Answer: "${answer}"
      ${resumeContext}
      
      TASK:
      1. Provide a 2-sentence STAR analysis.
      2. GAP ANALYSIS: Check if the user's spoken answer supports or contradicts their resume claims. If they mentioned something in their resume that would have made this answer stronger but failed to say it, point it out.
      
      Be concise, brutal, and helpful.
    `;

    const analysis = await askGemini(prompt);
    res.json({ analysis });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Analysis failed" });
  }
});

// POST /api/session/classify
// Classify a transcript chunk into STAR framework
router.post('/classify', protect, async (req, res) => {
  try {
    const { text } = req.body;

    const prompt = `Classify this interview answer text into exactly one of these: Situation, Task, Action, Result, Unclear.
Return only that single word, nothing else.

Text: "${text}"`;

    const result = await askGemini(prompt);
    res.json({ classification: result.trim() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/session/save
// Save a completed session to MongoDB
router.post('/save', protect, async (req, res) => {
  try {
    const { role, company, level, persona, answers } = req.body;

    const session = await Session.create({
      user: req.user._id,
      role,
      company,
      level,
      persona,
      answers
    });

    res.status(201).json({ sessionId: session._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/session/report
// Generate AI debrief report for a session
router.post('/report', protect, async (req, res) => {
  try {
    const { sessionId } = req.body;

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    // Combine all answers into one transcript
    const fullTranscript = session.answers
      .map((a, i) => `Q${i + 1}: ${a.question}\nAnswer: ${a.transcript}`)
      .join('\n\n');

    const prompt = `You are an expert interview coach. Analyze this mock interview transcript and return ONLY a JSON object with these exact keys:
- confidenceScore: number from 0 to 100
- fillerCount: number of filler words used (um, uh, like, you know, basically, literally)
- bestSentence: the single strongest sentence the candidate said
- weakestPoint: the biggest weakness in their answers
- tips: array of exactly 3 short improvement tips

Transcript:
${fullTranscript}

Return ONLY the JSON object, no explanation.`;

    const report = await askGeminiJSON(prompt);

    // Save report to session
    session.report = report;
    await session.save();

    res.json({ report });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/session/history
// Get all sessions for logged-in user
router.get('/history', protect, async (req, res) => {
  try {
    const sessions = await Session.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .select('-answers');
    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/session/:id
// Get a single session
router.get('/:id', protect, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    res.json({ session });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/scorecard/:id
// Public scorecard — no auth needed
router.get('/scorecard/:id', async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (!session.isPublic) return res.status(403).json({ error: 'This scorecard is private' });
    res.json({ session });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;