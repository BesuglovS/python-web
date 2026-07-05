import re

with open('config.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the LESSON_QUIZZES line range
quiz_start = None
quiz_end = None
in_quizzes = False
brace_depth = 0

for i, line in enumerate(lines):
    if 'const LESSON_QUIZZES = {' in line:
        quiz_start = i
        in_quizzes = True
        brace_depth = 1
        continue
    if in_quizzes:
        brace_depth += line.count('{') - line.count('}')
        if brace_depth == 0:
            quiz_end = i + 1
            break

print(f'LESSON_QUIZZES: lines {quiz_start+1} to {quiz_end}')

# Extract the quiz section content
quiz_lines = lines[quiz_start:quiz_end]

# Find all key indices (lines with "  N: [" or "  TMP" etc.)
key_lines = []
for i, line in enumerate(quiz_lines):
    stripped = line.strip()
    # Match lines like "7: [" or "TMP7: [" or "_Q15_: ["
    if re.match(r'^[\w_]+:\s*\[', stripped):
        key_lines.append((i, stripped))

print(f'Found {len(key_lines)} keys in LESSON_QUIZZES:')
for idx, key_str in key_lines:
    print(f'  line {quiz_start+idx+1}: {key_str}')

# Build a map of old_key -> line_index
# We'll find continuous blocks (each key followed by its array items, ending with "  ],")
blocks = []
for ki in range(len(key_lines)):
    start_idx = key_lines[ki][0]
    end_idx = quiz_lines.index('  ],\n', start_idx + 1) if '  ],\n' in quiz_lines[start_idx+1:] else None
    if end_idx is None:
        # Find next "  ],"
        for j in range(start_idx + 1, len(quiz_lines)):
            if quiz_lines[j].strip() == '],':
                end_idx = j + 1
                break
    else:
        end_idx = quiz_lines.index('  ],\n', start_idx + 1) + 1
    key_name = key_lines[ki][1].split(':')[0]
    blocks.append((key_name, start_idx, end_idx))
    print(f'Block {key_name}: lines {start_idx}-{end_idx} (in quiz section)')

# Extract the data for each block
block_data = {}
for key_name, start_idx, end_idx in blocks:
    block_data[key_name] = quiz_lines[start_idx:end_idx]

# Define the desired mapping: what each key should become
# Original mapping (before any changes):
# 7: number-ops, 8: booleans, 9: conditional, 10: try-except, 11: complex-conditions,
# 12: nested-structures, 13: strings-index-slice, 14: string-ops, 15: f-strings (TMP7)

# Target: f-strings at 7, then 7->8, 8->9, ..., 14->15
# So we need to know what each block contains

# Let's identify blocks by their first question
def first_question(block_lines):
    for line in block_lines:
        if 'question:' in line:
            return line.strip()
    return 'UNKNOWN'

for key_name in block_data:
    fq = first_question(block_data[key_name])
    print(f'Key {key_name}: {fq[:80]}...')