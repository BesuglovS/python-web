import re

with open('config.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Find LESSON_QUIZZES boundaries
start_marker = 'const LESSON_QUIZZES = {'
start = content.find(start_marker)
if start == -1:
    print('ERROR: LESSON_QUIZZES not found')
    exit(1)

# Find the closing }; for this object
depth = 0
end = -1
for i in range(start + len(start_marker), len(content)):
    if content[i] == '{':
        depth += 1
    elif content[i] == '}':
        if depth == 0:
            end = i + 2  # include };
            break
        depth -= 1

before = content[:start]
quiz_section = content[start:end]
after = content[end:]

print(f'Section length: {len(quiz_section)}')

# Strategy: shift keys 7-14 to 8-15, then put f-strings (TMP7) into 7
# Current state has keys 7-14 at old positions, TMP7 at f-strings spot
# We need: 7→8, 8→9, 9→10, 10→11, 11→12, 12→13, 13→14, 14→15, TMP7→7

# Use unique markers to avoid partial matches
# Replace TMP7 block with a unique placeholder first
quiz_section = quiz_section.replace(
    '  TMP7: [',
    '  __REINSERT_7__: ['
)

# Now shift from high to low: 14→15, 13→14, ..., 7→8
# Each key is followed by a unique first question we can match

replacements = [
    # 14 -> _TMP15_
    ('  14: [\n    { question: \\'Что вернёт <code>\\\"hello\\\".upper()</code>?\\',',
     '  _TMP15_: [\n    { question: \\'Что вернёт <code>\\\"hello\\\".upper()</code>?\\','),
    # 13 -> 14
    ('  13: [\n    { question: \\'Что вернёт <code>\\\"Python\\\"[0]</code>?\\',',
     '  14: [\n    { question: \\'Что вернёт <code>\\\"Python\\\"[0]</code>?\\','),
    # 12 -> 13
    ('  12: [\n    { question: \\'Что такое вложенная структура в Python?\\',',
     '  13: [\n    { question: \\'Что такое вложенная структура в Python?\\','),
    # 11 -> 12
    ('  11: [\n    { question: \\'Когда <code>x > 0 and x < 10</code> истинно?\\',',
     '  12: [\n    { question: \\'Когда <code>x > 0 and x < 10</code> истинно?\\','),
    # 10 -> 11
    ('  10: [\n    { question: \\'Что произойдёт при выполнении <code>int(\\\"abc\\\")</code>?\\',',
     '  11: [\n    { question: \\'Что произойдёт при выполнении <code>int(\\\"abc\\\")</code>?\\','),
    # 9 -> 10
    ('  9: [\n    { question: \\'Сколько пробелов рекомендуется для отступа по PEP 8?\\',',
     '  10: [\n    { question: \\'Сколько пробелов рекомендуется для отступа по PEP 8?\\','),
    # 8 -> 9
    ('  8: [\n    { question: \\'Чему равно <code>True and False</code>?\\',',
     '  9: [\n    { question: \\'Чему равно <code>True and False</code>?\\','),
    # 7 -> 8
    ('  7: [\n    { question: \\'Чему равно <code>17 % 5</code>?\\',',
     '  8: [\n    { question: \\'Чему равно <code>17 % 5</code>?\\','),
    # __REINSERT_7__ -> 7
    ('  __REINSERT_7__: [\n    { question: \\'Что такое f-строка в Python?\\',',
     '  7: [\n    { question: \\'Что такое f-строка в Python?\\','),
    # _TMP15_ -> 15
    ('  _TMP15_: [\n    { question: \\'Что вернёт <code>\\\"hello\\\".upper()</code>?\\',',
     '  15: [\n    { question: \\'Что вернёт <code>\\\"hello\\\".upper()</code>?\\','),
]

for old, new in replacements:
    if old in quiz_section:
        quiz_section = quiz_section.replace(old, new)
        print(f'Replaced successfully')
    else:
        print(f'WARNING: Could not find pattern for replacement')
        # Show what's around
        idx = quiz_section.find(old[:20])
        if idx >= 0:
            print(f'  Found partial at {idx}: ...{quiz_section[idx:idx+50]}...')

# Write back
new_content = before + quiz_section + after
with open('config.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print('Done!')