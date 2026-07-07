"""Strip LESSON_QUIZZES data from config.js, keep metadata only."""
import re

import os
BASE = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(BASE, 'config.js'), 'r', encoding='utf-8') as f:
    content = f.read()

# Remove LESSON_QUIZZES data block: from "var LESSON_QUIZZES = {" through its closing "};"
# The quiz data starts with "var LESSON_QUIZZES = {" and ends with a line that has just "};"
# followed by the BADGES section

# Strategy: find "var LESSON_QUIZZES = {" and replace everything from that
# through the matching closing "};" with the stub

# Find the start of LESSON_QUIZZES
quiz_start = content.find('var LESSON_QUIZZES = {')
if quiz_start == -1:
    print('ERROR: Could not find LESSON_QUIZZES declaration')
    exit(1)

# Find BADGES section start
badges_start = content.find('/** Система достижений (бейджей). */\nvar BADGES')
if badges_start == -1:
    badges_start = content.find('var BADGES')
if badges_start == -1:
    print('ERROR: Could not find BADGES declaration')
    exit(1)

# Build new content: everything before quiz + stub + everything from BADGES onward
stub = """/**
 * Вопросы для самопроверки (quiz) — загружаются асинхронно из папки quizzes/.
 * Формат: lesson => [{ question, options: [], correct: индекс правильного, explanation }]
 * См. quizzes/{номер-урока}.json и quizzes/final-test.json
 *
 * LESSON_QUIZZES заполняется динамически при загрузке страницы урока
 * скриптом script.js (функция loadQuizForLesson).
 */
var LESSON_QUIZZES = {};

"""

before_quiz = content[:quiz_start]
after_quiz = content[badges_start:]

new_content = before_quiz + stub + after_quiz

with open(os.path.join(BASE, 'config.js'), 'w', encoding='utf-8') as f:
    f.write(new_content)

original_size = len(content.encode('utf-8'))
new_size = len(new_content.encode('utf-8'))
print(f'Original: {original_size:,} bytes')
print(f'New:      {new_size:,} bytes')
print(f'Saved:    {(original_size - new_size):,} bytes ({((1 - new_size/original_size)*100):.0f}% reduction)')
print('Done! LESSON_QUIZZES data removed from config.js')