/**
 * Extract quiz data from config.js into individual JSON files.
 * Run: node extract-quizzes.js
 */
const fs = require('fs');
const path = require('path');

// Read config.js
const configContent = fs.readFileSync(path.join(__dirname, 'config.js'), 'utf8');

// Evaluate config.js using Function constructor (runs in global scope)
const fn = new Function(configContent + '\nreturn { LESSON_QUIZZES: LESSON_QUIZZES, BADGES: BADGES };');
const result = fn();

const LESSON_QUIZZES = result.LESSON_QUIZZES;
const BADGES = result.BADGES;

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
