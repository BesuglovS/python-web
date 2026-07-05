#!/usr/bin/env python3
"""Fix config.js after inserting f-strings lesson between 6 and 7."""
import re
import os
import sys

# Force UTF-8 output on Windows
sys.stdout.reconfigure(encoding='utf-8')

os.chdir(os.path.dirname(os.path.abspath(__file__)))

with open('config.js', 'r', encoding='utf-8') as f:
    text = f.read()

# ============================================================
# 1. LESSON_QUIZZES - most critical part. Move TMP7 → 7, shift 7-14 → 8-15
# ============================================================
# Strategy: use text replacement with placeholder markers

# Step 1a: Remove the stray f-string question from old key 14
# In the old key 14 (string-ops), there was an extra f-string question added.
# We need to remove it. Let's find the pattern.
# The question: "Что такое f-строка в Python?"
# In key 14, between Q3 (Ha * 3) and Q4 (escape seq), there's an f-string question.
# After shifting, this key 14 will become key 15. We need to remove this extra Q.
old_fstring_q_pattern = r"""    \{ question: 'Что такое f-строка в Python\?', options: \['Строка, начинающаяся с f, с подстановкой переменных через \{\}', 'Строка, отформатированная жирным шрифтом', 'Функция для строк', 'Файл со строками'\], correct: 0, explanation: 'f-строки \(f"текст \{выражение\}"\) подставляют значения переменных и выражений прямо в строку\.' \},\n"""
text = re.sub(old_fstring_q_pattern, '', text)
print("Step 1a: Removed stray f-string question from key 14")

# Step 1b: Rename TMP7 → __PLACEHOLDER_7__
text = text.replace('\n  TMP7: [', '\n  __PLACEHOLDER_7__: [')
print("Step 1b: Renamed TMP7 -> __PLACEHOLDER_7__")

# Step 1c: Shift keys 14→__KEY15__, 13→14, 12→13, 11→12, 10→11, 9→10, 8→9, 7→8
for old_n in range(14, 6, -1):
    new_n = old_n + 1
    text = text.replace(f'\n  {old_n}: [', f'\n  __KEY{new_n}__: [')
print("Step 1c: Shifted keys 7-14 -> 8-15")

# Step 1d: Rename temp keys to final
text = text.replace('__PLACEHOLDER_7__:', '7:')
for n in range(8, 16):
    text = text.replace(f'__KEY{n}__:', f'{n}:')
print("Step 1d: Renamed temp keys to final")

# ============================================================
# 2. THEORY_CONTESTS - shift all lesson numbers >= 7
# ============================================================
# Find lines in THEORY_CONTESTS and shift numbers in each line
lines = text.split('\n')
in_contests = False
for i, line in enumerate(lines):
    if 'THEORY_CONTESTS' in line and '{' in line:
        in_contests = True
        continue
    if in_contests and '};' in line:
        in_contests = False
        continue
    if in_contests:
        # Match: leading spaces, digits, colon, rest
        m = re.match(r'^(\s*)(\d+)(:.*)$', line)
        if m:
            num = int(m.group(2))
            if num >= 7:
                new_num = num + 1
                rest = m.group(3)
                # Update lesson number in comment
                rest = re.sub(r'Урок \d+', f'Урок {new_num}', rest)
                lines[i] = f"{m.group(1)}{new_num}{rest}"
text = '\n'.join(lines)
print("Step 2: Updated THEORY_CONTESTS")

# ============================================================
# 3. LESSON_META - shift keys 7-14 → 8-15, add new 7
# ============================================================
# Find LESSON_META section
meta_start = text.find('var LESSON_META = {')
meta_end = text.find('};', meta_start) + 2
meta_section = text[meta_start:meta_end]

# Extract the inner lines
inner_start = meta_section.find('{\n') + 1  # first { line position
inner_text = meta_section[inner_start:].rstrip('};')

# Add new entry 7 (f-strings) after entry 6
# Entry 6 ends with "}," or "}"
# Find the line with "6:" and insert after its closing brace
inner_lines = inner_text.split('\n')
new_inner_lines = []
for line in inner_lines:
    new_inner_lines.append(line)
    # After line with "  6:  { duration: 7,  complexity: 'beginner' },"
    if line.strip().startswith('6:') and 'complexity' in line:
        # Insert the new lesson 7 (f-strings)
        indent = ' ' * (len(line) - len(line.lstrip()))
        new_inner_lines.append(f"{indent}7:  {{ duration: 7,  complexity: 'basic' }},")

# Now shift keys 7-14 → 8-15
final_inner_lines = []
for line in new_inner_lines:
    m = re.match(r'^(\s*)(\d+)(:.*)$', line)
    if m:
        num = int(m.group(2))
        if 7 <= num <= 14:
            num += 1
        line = f"{m.group(1)}{num}{m.group(3)}"
    final_inner_lines.append(line)

new_meta = 'var LESSON_META = {\n' + '\n'.join(final_inner_lines) + '\n};'
text = text[:meta_start] + new_meta + text[meta_end:]
print("Step 3: Updated LESSON_META")

# ============================================================
# 4. BADGES - shift all lesson numbers >= 7
# ============================================================
# Find and shift all numbers in badge check functions
# Badge arrays contain numbers like [8,9,10,11,12] or [13,14,15,16]
# We need to shift all >= 7 by +1
def shift_badge_nums(match):
    nums_str = match.group(1)
    nums = [int(n.strip()) for n in nums_str.split(',')]
    new_nums = [n + 1 if n >= 7 else n for n in nums]
    return '[' + ','.join(str(n) for n in new_nums) + ']'

# Find the BADGES section
badges_start = text.find('var BADGES = [')
badges_section = text[badges_start:]

# Replace all number arrays in badges
# Pattern: [digit, digit, ...] inside check functions
badges_section_new = re.sub(
    r'\[([\d,\s]+)\]',
    shift_badge_nums,
    badges_section
)

text = text[:badges_start] + badges_section_new
print("Step 4: Updated BADGES")

# ============================================================
# Write back
# ============================================================
with open('config.js', 'w', encoding='utf-8') as f:
    f.write(text)

print("config.js updated successfully!")