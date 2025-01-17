import os
import re
from bs4 import BeautifulSoup

html_file = "flowers.html"  # The path to your HTML file
output_dir = "svgs"         # Directory where SVGs will be saved


def sanitize_filename(filename):
    """
    Replace non-alphanumeric characters with underscores
    to keep filenames safe for most file systems.
    """
    return re.sub(r'[^A-Za-z0-9]+', '_', filename).strip('_').lower()


# Create output directory if it doesn't exist
os.makedirs(output_dir, exist_ok=True)

with open(html_file, "r", encoding="utf-8") as f:
    soup = BeautifulSoup(f, "html.parser")

# Find all h1 elements in the document
headings = soup.find_all("h1")

for heading in headings:
    # Extract heading text (and strip extra whitespace)
    heading_text = heading.get_text(strip=True)
    if not heading_text:
        continue  # Skip empty headings

    # Find the next <svg> sibling after this heading
    svg_tag = heading.find_next("svg")
    if svg_tag:
        # Convert the <svg> tag (and its contents) to string
        svg_code = str(svg_tag)

        # Create a safe filename from the heading text
        svg_filename = sanitize_filename(heading_text) + ".svg"
        svg_path = os.path.join(output_dir, svg_filename)

        # Write the SVG code to the file
        with open(svg_path, "w", encoding="utf-8") as svg_file:
            svg_file.write(svg_code)

        print(f"Saved: {svg_filename}")
    else:
        print(f"No <svg> found after heading: {heading_text}")
