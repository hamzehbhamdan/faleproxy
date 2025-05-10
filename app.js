/* Simplified replacement logic: specific replacements are applied first, then a generic replacement for any remaining standalone 'Yale' */

// Replacement functions removed

// Define specific replacement patterns (removed)
// const replacements = [
//   { regex: /Yale University/gi, replacement: replacementYaleUniversity },
//   { regex: /Yale College/gi, replacement: replacementYaleCollege },
//   { regex: /yale medical school/gi, replacement: replacementYaleMedicalSchool }
// ];

function applyReplacements(text) {
  let result = text;

  // Helper function to replace "Yale" with "Fale" preserving case of "Yale"
  const replaceYaleWithFale = (match, yaleWord) => {
    if (yaleWord === 'YALE') return 'FALE';
    if (yaleWord === 'yale') return 'fale';
    return 'Fale';
  };

  // Replace "Yale University" with "Fale University", preserving case of "Yale"
  result = result.replace(/(YALE|Yale|yale) University/gi, (match, p1) => {
    return replaceYaleWithFale(match, p1) + ' University';
  });

  // Replace "Yale College" with "Fale College", preserving case of "Yale"
  result = result.replace(/(YALE|Yale|yale) College/gi, (match, p1) => {
    return replaceYaleWithFale(match, p1) + ' College';
  });

  // Replace "yale medical school" with "fale medical school", preserving case of "yale"
  result = result.replace(/(YALE|Yale|yale) medical school/gi, (match, p1) => {
    // For "medical school" specifically, if original was "yale medical school", output should be "fale medical school"
    // if original was "Yale medical school", output "Fale medical school"
    // if original was "YALE medical school", output "FALE medical school"
    // The replaceYaleWithFale helper handles the p1 (Yale/yale/YALE) part correctly.
    return replaceYaleWithFale(match, p1) + ' medical school';
  });

  // Replace standalone "Yale" with "Fale", preserving case
  result = result.replace(/\b(YALE|Yale|yale)\b/g, (match, p1) => {
    return replaceYaleWithFale(match, p1);
  });

  return result;
}

// Existing server setup code remains unchanged
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const app = express();
const PORT = process.env.TEST_PORT || process.env.PORT || 3001;

// Middleware to parse request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Route to serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint to fetch and modify content
app.post('/fetch', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Fetch the content from the provided URL
    const response = await axios.get(url);
    const html = response.data;

    // Use cheerio to parse HTML and selectively replace text content, not URLs
    const $ = cheerio.load(html);

    // Process text nodes in the body
    $('body *').contents().filter(function() {
      return this.nodeType === 3; // Text nodes only
    }).each(function() {
      const text = $(this).text();
      // Apply replacements if the node is within an anchor or if it matches specific Yale phrases or contains 'founded'
      if ($(this).parent().is('a') || /(?:Yale University|Yale College|yale medical school)/.test(text) || /founded/i.test(text)) {
        const newText = applyReplacements(text);
        if (text !== newText) {
          $(this).replaceWith(newText);
        }
      }
    });
    
    // Process title separately using trimmed text
    const titleText = $('title').text().trim();
    $('title').text(applyReplacements(titleText));
    
    return res.json({ 
      success: true, 
      content: $.html(),
      title: $('title').text(),
      originalUrl: url
    });
  } catch (error) {
    console.error('Error fetching URL:', error.message);
    return res.status(500).json({ 
      error: `Failed to fetch content: ${error.message}` 
    });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Faleproxy server running at http://localhost:${PORT}`);
  });
}

// Make applyReplacements available for testing if needed, and keep default export for Vercel
app.applyReplacements_for_test = applyReplacements;
module.exports = app;
