const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Session = require('../models/Session');
const User = require('../models/User');
const { generateJsonFromAI, generateTextFromAI } = require('../config/gemini');

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const splitSentences = (text = '') =>
  text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

const countFillerWords = (text = '') => {
  const matches = text.match(/\b(um|uh|like|you know|basically|literally)\b/gi);
  return matches ? matches.length : 0;
};

const classifyStarTextLocally = (text = '') => {
  const normalized = text.toLowerCase();

  if (!normalized.trim()) return 'Unclear';
  if (/(we needed to|my goal was to|i was responsible for|i had to)/.test(normalized)) return 'Task';
  if (/(i built|i created|i led|i implemented|i improved|i designed|i shipped|i migrated|i fixed)/.test(normalized)) return 'Action';
  if (/(resulted in|led to|improved|reduced|increased|grew|saved|delivered)/.test(normalized)) return 'Result';
  if (/(at my previous|when i was|in my last role|the project|the team|the situation)/.test(normalized)) return 'Situation';
  return 'Unclear';
};

const buildFallbackQuestions = ({ role, company, level, persona }) => {
  const companyLabel = company || 'your target company';
  const roleLabel = role || 'this role';
  const levelLabel = level || 'Mid';
  const personaPrefix = {
    friendly: 'Walk me through',
    aggressive: 'Convince me',
    silent: 'Explain'
  };
  const opener = personaPrefix[persona] || personaPrefix.friendly;

  return [
    `${opener} a project that proves you can succeed as a ${levelLabel} ${roleLabel} at ${companyLabel}.`,
    `Tell me about a hard technical decision you made in a ${roleLabel} project and why you chose that path.`,
    `Describe a time you found a quality, performance, or scalability problem before it hurt users.`,
    `Give me an example of how you handled disagreement or feedback while shipping work with a team.`,
    `If you joined ${companyLabel} tomorrow in a ${roleLabel} role, what would your first 30 days look like?`
  ];
};

const buildFallbackAnalysis = ({ question, answer, resumeClaims = [] }) => {
  const text = (answer || '').trim();

  if (text.length < 10) {
    return 'Answer too short for analysis.';
  }

  const sentences = splitSentences(text);
  const starSignals = {
    situation: /(when|at my previous|the project|the team|during)/i.test(text),
    task: /(my goal|i was responsible|needed to|had to)/i.test(text),
    action: /(i built|i created|i led|i implemented|i improved|i fixed|i designed)/i.test(text),
    result: /(result|impact|improved|reduced|increased|saved|delivered)/i.test(text)
  };

  const missing = Object.entries(starSignals)
    .filter(([, present]) => !present)
    .map(([part]) => part.toUpperCase());

  const mentionedClaims = resumeClaims.filter((claim) =>
    text.toLowerCase().includes(claim.toLowerCase().slice(0, 20))
  );

  const starSummary =
    missing.length === 0
      ? 'Strong STAR structure: your answer covers context, ownership, action, and outcome.'
      : `Your answer is missing clear ${missing.join(', ')} details, so the story feels incomplete.`;

  const gapSummary =
    resumeClaims.length === 0
      ? 'No resume context was available, so the feedback is based only on your spoken answer.'
      : mentionedClaims.length > 0
        ? `You supported resume claims such as ${mentionedClaims.slice(0, 2).join(', ')} with examples from your answer.`
        : 'Your answer did not connect back to the strongest claims in your resume, so it missed an easy credibility boost.';

  const followUp =
    sentences.length < 3
      ? 'Add one sentence for the challenge, one for your action, and one for the measurable outcome.'
      : `Tighten the answer around the question "${question}" and end with a concrete metric or business result.`;

  return `${starSummary} ${gapSummary} ${followUp}`;
};

const buildFallbackReport = (session) => {
  const transcripts = session.answers.map((answer) => answer.transcript || '').filter(Boolean);
  const combinedText = transcripts.join(' ');
  const sentences = splitSentences(combinedText);
  const fillerCount = countFillerWords(combinedText);
  const averageLength = transcripts.length
    ? transcripts.reduce((total, answer) => total + answer.split(/\s+/).filter(Boolean).length, 0) / transcripts.length
    : 0;

  const confidenceScore = clamp(Math.round(55 + averageLength - fillerCount * 2), 35, 92);
  const bestSentence = sentences.sort((a, b) => b.length - a.length)[0] || 'You kept showing up with clear intent.';
  const weakestPoint =
    averageLength < 35
      ? 'Your answers were too short, which made your impact and reasoning harder to evaluate.'
      : fillerCount > 5
        ? 'Filler words and hedging weakened otherwise solid points.'
        : 'Your answers would be stronger with more explicit metrics and business outcomes.';

  return {
    confidenceScore,
    fillerCount,
    bestSentence,
    weakestPoint,
    tips: [
      'Use a tighter STAR structure and name the business outcome explicitly.',
      'Add at least one metric, constraint, or tradeoff to each answer.',
      'End every answer with the result and what changed because of your work.'
    ]
  };
};

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

    const questions = await generateJsonFromAI(prompt);
    const normalizedQuestions = Array.isArray(questions) ? questions.filter(Boolean).slice(0, 5) : [];

    if (normalizedQuestions.length === 0) {
      throw new Error('Gemini returned an invalid questions payload.');
    }

    res.json({ questions: normalizedQuestions, source: 'gemini' });
  } catch (err) {
    if (err.code === 'GEMINI_UNAVAILABLE') {
      console.warn('Falling back to local interview question generator:', err.message);
      return res.json({
        questions: buildFallbackQuestions(req.body),
        source: 'fallback',
        warning: 'Gemini is currently unavailable, so local question generation was used.'
      });
    }

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

    const analysis = await generateTextFromAI(prompt);
    res.json({ analysis, source: 'gemini' });
  } catch (err) {
    if (err.code === 'GEMINI_UNAVAILABLE') {
      console.warn('Falling back to local STAR analysis:', err.message);
      const user = await User.findById(req.user._id);
      return res.json({
        analysis: buildFallbackAnalysis({
          question: req.body.question,
          answer: req.body.answer,
          resumeClaims: user?.resumeClaims || []
        }),
        source: 'fallback',
        warning: 'Gemini is currently unavailable, so local feedback was used.'
      });
    }

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

    const result = await generateTextFromAI(prompt);
    res.json({ classification: result.trim(), source: 'gemini' });
  } catch (err) {
    if (err.code === 'GEMINI_UNAVAILABLE') {
      console.warn('Falling back to local STAR classification:', err.message);
      return res.json({
        classification: classifyStarTextLocally(req.body.text),
        source: 'fallback',
        warning: 'Gemini is currently unavailable, so local classification was used.'
      });
    }

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

    const report = await generateJsonFromAI(prompt);

    // Save report to session
    session.report = report;
    await session.save();

    res.json({ report, source: 'gemini' });
  } catch (err) {
    if (err.code === 'GEMINI_UNAVAILABLE') {
      console.warn('Falling back to local report generation:', err.message);
      const session = await Session.findById(req.body.sessionId);
      if (!session) return res.status(404).json({ error: 'Session not found' });

      const fallbackReport = buildFallbackReport(session);
      session.report = fallbackReport;
      await session.save();

      return res.json({
        report: fallbackReport,
        source: 'fallback',
        warning: 'Gemini is currently unavailable, so a local report was generated.'
      });
    }

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
