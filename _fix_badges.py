#!/usr/bin/env python3
"""Fix BADGES in config.js for the lesson 15→7 shift.
Old lessons 7-14 → +1 (new 8-15), old 15 → new 7.
Badges with references to lessons >= 7 need updating."""

import re

with open("config.js", "r", encoding="utf-8") as f:
    content = f.read()

# Mapping: old lesson number → new lesson number
# Only lessons 7-15 changed; 1-6 same, 16-50 same
old_to_new = {}
for i in range(1, 51):
    if i < 7:
        old_to_new[i] = i
    elif i == 15:
        old_to_new[i] = 7
    elif 7 <= i <= 14:
        old_to_new[i] = i + 1
    else:  # i >= 16
        old_to_new[i] = i

# The BADGES section uses old lesson numbers (since _fix_config didn't touch them).
# We need to convert each lesson reference in BADGES from old to new.
# Badges reference lessons in arrays like [9,10,11,12,13] or c[11].

def fix_lesson_in_array(match):
    """Fix lesson numbers inside array literals like [9,10,11,12,13]"""
    nums = re.findall(r'\d+', match.group(0))
    fixed = [str(old_to_new.get(int(n), int(n))) for n in nums]
    return '[' + ','.join(fixed) + ']'

def fix_lesson_ref(match):
    """Fix individual lesson references like c[11]"""
    num = int(match.group(1))
    new_num = old_to_new.get(num, num)
    return f'c[{new_num}]'

# Fix the BADGES section
badges_start = content.find('var BADGES = [')
badges_end = content.find('];', badges_start) + 2

badges_section = content[badges_start:badges_end]
fixed_badges = badges_section

# Pattern 1: arrays of lesson numbers [1,2,3] in check functions
# These appear in .every(function(n){return c[n];}) constructs
fixed_badges = re.sub(r'\[[\d,\s]+\]', fix_lesson_in_array, fixed_badges)

# Pattern 2: individual c[num] references
fixed_badges = re.sub(r'c\[(\d+)\]', fix_lesson_ref, fixed_badges)

content = content[:badges_start] + fixed_badges + content[badges_end:]

with open("config.js", "w", encoding="utf-8") as f:
    f.write(content)

print("BADGES fixed successfully!")
print("Old → New mapping for lessons 7-15:")
for old in range(7, 16):
    print(f"  {old} → {old_to_new[old]}")