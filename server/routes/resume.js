const express = require('express');
const router = express.Router();
const multer = require('multer');
const { PDFParse } = require('pdf-parse');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Configure Multer (Memory Storage)
const upload = multer({ storage: multer.memoryStorage() });

// @desc    Upload Resume, Extract Text, and Save to User Profile
// @route   POST /api/resume/upload
router.post('/upload', protect, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      console.log("No file received");
      return res.status(400).json({ error: 'Please upload a PDF file' });
    }

    console.log("File received:", req.file.originalname);

    // Attempt to parse
    const parser = new PDFParse({ data: req.file.buffer });
    const data = await parser.getText();
    await parser.destroy();
    const fullText = data.text;

    if (!fullText || fullText.trim().length === 0) {
        throw new Error("PDF parsed but no text found");
    }

    const claimsArray = fullText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 15);

    await User.findByIdAndUpdate(req.user._id, {
      rawResumeText: fullText,
      resumeClaims: claimsArray
    });

    console.log("Upload Success:", claimsArray.length, "claims extracted.");
    res.json({ message: 'Success', claimsCount: claimsArray.length });

  } catch (error) {
    console.error("DETAILED SERVER ERROR:", error.message);
    res.status(500).json({ error: error.message || 'Failed to parse PDF' });
  }
});

module.exports = router;