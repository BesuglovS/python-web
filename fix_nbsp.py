import re

with open('python-web/config.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace 4 consecutive spaces inside <code> blocks with &nbsp;
# The code is on a single line with <br> separators, so we match the spaces directly
def replace_indent(match):
    full = match.group(0)
    code_content = match.group(1)
    # Replace 4-space indentation within the code content
    fixed = code_content.replace('    ', '&nbsp;&nbsp;&nbsp;&nbsp;')
    return '<code>' + fixed + '</code>'

# Use a non-greedy match
text = re.sub(r'<code>(.*?)</code>', replace_indent, text, flags=re.DOTALL)

with open('python-web/config.js', 'w', encoding='utf-8') as f:
    f.write(text)

print("Done")