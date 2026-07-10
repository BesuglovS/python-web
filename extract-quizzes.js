/**
 * Extract quiz data from config.js into individual JSON files.
 * Run: node extract-quizzes.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Read config.js
const configContent = fs.readFileSync(path.join(__dirname, 'config.js'), 'utf8');

// Evaluate config.js in a sandboxed context using vm module
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(configContent, sandbox, { timeout: 1000 });
const LESSON_QUIZZES = sandbox.LESSON_QUIZZES || {};
const BADGES = sandbox.BADGES || [];
console.log(`Parsed LESSON_QUIZZES: ${Object.keys(LESSON_QUIZZES).length} lessons, BADGES: ${BADGES.length} badges`);

// Create quizzes directory
const quizzesDir = path.join(__dirname, 'quizzes');
if (!fs.existsSync(quizzesDir)) {
  fs.mkdirSync(quizzesDir);
}

// Write each lesson's quiz to a separate JSON file
if (LESSON_QUIZZES) {
  for (const [key, questions] of Object.entries(LESSON_QUIZZES)) {
    const filename = path.join(quizzesDir, `${key}.json`);
    fs.writeFileSync(filename, JSON.stringify(questions, null, 2), 'utf8');
    console.log(`Written: quizzes/${key}.json (${questions.length} questions)`);
  }
}
console.log(`\nTotal: ${Object.keys(LESSON_QUIZZES).length} quiz files created.`);

if (BADGES) {
  console.log(`\nBADGES: ${BADGES.length} badges`);
}
