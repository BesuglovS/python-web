#!/usr/bin/env python3
"""Fix BADGES in config.js - correct version.
After the lesson shift (old 15→new 7, old 7-14→new 8-15),
BADGES need to reference NEW lesson numbers.

The previous _fix_badges.py incorrectly shifted ALL numbers >= 7 by +1.
We need to fix: 15→7 (not 15→16), and undo the +1 shift for 16+.
"""

import re

import os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
with open("config.js", "r", encoding="utf-8") as f:
    content = f.read()

# Old → New mapping
# old 1-6 → new 1-6 (unchanged)
# old 7-14 → new 8-15 (+1)
# old 15 → new 7
# old 16-50 → new 16-50 (unchanged)
old_to_new = {}
for i in range(1, 51):
    if i < 7:
        old_to_new[i] = i
    elif 7 <= i <= 14:
        old_to_new[i] = i + 1
    elif i == 15:
        old_to_new[i] = 7
    else:
        old_to_new[i] = i

print("Old -> New mapping:")
for old in sorted(old_to_new):
    if old_to_new[old] != old:
        print(f"  {old} -> {old_to_new[old]}")

# Current state of BADGES: the previous script ran old→new mapping but
# was WRONG (used 15→16 and shifted 16+ by 1).
# The previous script transformed: old_num → (old_num if <7 else old_num+1)
# Then for special case 15, it got 16 (since 15→16 in that scheme).
# And 16-50 got shifted to 17-51.

# We need to:
# 1. First revert the previous incorrect transformation
# 2. Then apply the correct transformation

# Actually, simpler: the previous script did:
#   new_num = old_num if old_num < 7 else old_num + 1
# So the current BADGES numbers = old_num + (1 if old_num >= 7 else 0)
#
# To get back to old_num: n - (1 if n > 7 else 0), but n=16 came from 15
# Actually: old 7→8, 8→9, 9→10, 10→11, 11→12, 12→13, 13→14, 14→15, 15→16, 16→17, 17→18, ...
# So current values: 1-6 unchanged, then shifted +1 from 7 onwards.
# To revert: subtract 1 from all values > 6
# Then apply correct mapping.

def revert_previous_fix(num):
    """Undo the previous incorrect +1 shift for >=7."""
    if num <= 6:
        return num
    else:
        return num - 1

def apply_correct_fix(old_num):
    """Apply correct old→new mapping."""
    return old_to_new.get(old_num, old_num)

# Fix all numbers in the BADGES section
badges_start = content.find('var BADGES = [')
badges_end = content.find('];', badges_start) + 2

badges_section = content[badges_start:badges_end]

def fix_number(match):
    num = int(match.group(0))
    old = revert_previous_fix(num)
    new = apply_correct_fix(old)
    return str(new)

fixed_badges = re.sub(r'\b(\d+)\b', fix_number, badges_section)

content = content[:badges_start] + fixed_badges + content[badges_end:]

with open("config.js", "w", encoding="utf-8") as f:
    f.write(content)

print("\nBADGES fixed correctly!")
print("\nVerifying BADGES:")
# Print the fixed BADGES section for verification
for line in fixed_badges.split('\n'):
    if 'check:' in line or 'desc:' in line:
        print(line.strip())