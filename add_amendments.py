import re

path = r"C:/Users/Giuseppe.corsell/OneDrive - Beroe Consulting (I) Pvt. Ltd/Desktop/nnamu/3_Product & Project/4_Claudecode/2_Projects/Beroe MI/Signal Market Report platform/mockup/src/data/mockData.js"

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add amendments: [], before each "archived:" line that doesn't already have it
# We only want to add it to survey objects (inside SURVEYS array)
# Find the SURVEYS array boundaries
surveys_start = content.find('export const SURVEYS = [')
surveys_end = content.find('\nexport const AUDIT_EVENTS')

surveys_section = content[surveys_start:surveys_end]

def add_amendments(section):
    lines = section.split('\n')
    result = []
    for line in lines:
        stripped = line.strip()
        # If this line is "archived: ..." and previous lines don't have amendments
        if stripped.startswith('archived:') and 'amendments' not in '\n'.join(result[-5:]):
            indent = len(line) - len(line.lstrip())
            result.append(' ' * indent + 'amendments: [],')
        result.append(line)
    return '\n'.join(result)

new_surveys_section = add_amendments(surveys_section)
new_content = content[:surveys_start] + new_surveys_section + content[surveys_end:]

with open(path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Done. Added amendments: [] to all surveys.")
