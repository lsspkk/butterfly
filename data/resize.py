#!/usr/bin/env python3

import sys
from PIL import Image


def resize_to_width(input_path: str, output_path: str, new_width: int = 800):
    """
    Resizes the input image to the specified new_width while
    preserving aspect ratio (height is automatically adjusted).
    Saves the result to output_path.
    """
    # Open the image
    with Image.open(input_path) as img:
        original_width, original_height = img.size

        # Calculate new height based on aspect ratio
        new_height = int((new_width / original_width) * original_height)

        # Resize the image
        resized_img = img.resize((new_width, new_height), Image.LANCZOS)

        # Save the resized image
        resized_img.save(output_path)
        print(f"Saved resized image to: {output_path}")


if __name__ == "__main__":
    """
    Usage:
      python resize_to_800px.py <input_image.png> <output_image.png>

    This will resize <input_image.png> to 800px width (and an automatically
    calculated height) and write the result to <output_image.png>.
    """
    if len(sys.argv) != 3:
        print("Usage: python resize_to_800px.py <input_image.png> <output_image.png>")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]

    resize_to_width(input_file, output_file, new_width=800)
