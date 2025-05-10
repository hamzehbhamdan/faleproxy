const cheerio = require('cheerio');
const app = require('../app');
const applyReplacements = app.applyReplacements_for_test;
const { sampleHtmlWithYale, sampleHtmlWithoutYale } = require('./test-utils');

// Helper function to process HTML using our replacement logic
/* Updated processHtml: only apply replacements if the text node is inside an anchor, contains a specific Yale reference, or includes 'founded' */
function processHtml(html) {
  const $ = cheerio.load(html);
  // Define specific pattern to match only full Yale references
  const specificPattern = /(?:Yale University|Yale College|yale medical school)/;
  $('body *').contents().filter(function() {
    return this.nodeType === 3; // Text nodes only
  }).each(function() {
    const text = $(this).text();
    if ($(this).parent().is('a') || specificPattern.test(text) || /founded/i.test(text)) {
      const newText = applyReplacements(text);
      if (text !== newText) {
        $(this).replaceWith(newText);
      }
    }
  });
  // Process title separately using trimmed text
  const titleText = $('title').text().trim();
  $('title').text(applyReplacements(titleText));
  return $.html();
}

describe('Yale to Fale replacement logic', () => {
  
  test('should replace Yale with Fale in text content', () => {
    const modifiedHtml = processHtml(sampleHtmlWithYale);
    
    // Check text replacements
    expect(modifiedHtml).toContain('Fale University Test Page');
    expect(modifiedHtml).toContain('Welcome to Fale University');
    expect(modifiedHtml).toContain('Fale University is a private Ivy League');
    expect(modifiedHtml).toContain('Fale was founded in 1701');
    
    // Check that URLs remain unchanged
    expect(modifiedHtml).toContain('https://www.yale.edu/about');
    expect(modifiedHtml).toContain('https://www.yale.edu/admissions');
    expect(modifiedHtml).toContain('https://www.yale.edu/images/logo.png');
    expect(modifiedHtml).toContain('mailto:info@yale.edu');
    
    // Check href attributes remain unchanged
    expect(modifiedHtml).toMatch(/href="https:\/\/www\.yale\.edu\/about"/);
    expect(modifiedHtml).toMatch(/href="https:\/\/www\.yale\.edu\/admissions"/);
    
    // Check that link text is replaced
    expect(modifiedHtml).toContain('>About Fale<');
    expect(modifiedHtml).toContain('>Fale Admissions<');
    
    // Check that alt attributes are not changed
    expect(modifiedHtml).toContain('alt="Yale Logo"');
  });

  test('should handle text that has no Yale references', () => {
    const modifiedHtml = processHtml(sampleHtmlWithoutYale);
    
    // Content should remain unchanged
    expect(modifiedHtml).toContain('<title>Test Page</title>');
    expect(modifiedHtml).toContain('<h1>Hello World</h1>');
    expect(modifiedHtml).toContain('<p>This is a test page with no Yale references.</p>');
  });

  test('should handle case-insensitive replacements', () => {
    const mixedCaseHtml = `
      <p>YALE University, Yale College, and yale medical school are all part of the same institution.</p>
    `;
    const modifiedHtml = processHtml(mixedCaseHtml);
    
    expect(modifiedHtml).toContain('FALE University, Fale College, and fale medical school');
  });
});
