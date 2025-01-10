#!/usr/bin/env python3

import argparse
import os
from PIL import Image


def slice_and_resize_butterfly(
    input_path: str,
    body_width: int,
    min_wing_width: int,
    max_wing_width: int,
    output_dir: str = "outputs"
):
    """
    Slices a top-down butterfly image into left wing, body, and right wing.
    Keeps the body at the given width, and resizes the wings to 10
    different widths between min_wing_width and max_wing_width (inclusive).

    :param input_path: Path to the input PNG image of the butterfly.
    :param body_width: The (horizontal) width in pixels of the butterfly's body.
    :param min_wing_width: The minimum target width for one wing.
    :param max_wing_width: The maximum target width for one wing.
    :param output_dir: Directory where output files will be saved.
    """

    # Open the original image
    original_img = Image.open(input_path).convert("RGBA")
    w, h = original_img.size

    # Compute center (assuming butterfly is horizontally centered)
    center_x = w // 2

    # Calculate the left and right boundaries of the body
    body_left = center_x - body_width // 2
    body_right = body_left + body_width

    # Safety checks
    if body_left < 0 or body_right > w:
        raise ValueError(
            "Body width is too large or the butterfly is not centered properly."
        )

    # Crop out three parts: left wing, body, right wing
    left_wing = original_img.crop((0, 0, body_left, h))
    body = original_img.crop((body_left, 0, body_right, h))
    right_wing = original_img.crop((body_right, 0, w, h))

    # Number of output images
    num_outputs = 7

    # Create output directory if it does not exist
    os.makedirs(output_dir, exist_ok=True)

    # Generate 10 different wing widths between min_wing_width and max_wing_width
    if num_outputs > 1:
        step = (max_wing_width - min_wing_width) / (num_outputs - 1)
    else:
        step = 0

    for i in range(num_outputs):
        # Current wing width for each side
        current_wing_width = int(min_wing_width + i * step)

        # Resize the left and right wings horizontally to current_wing_width
        new_left_wing = left_wing.resize(
            (current_wing_width, h), resample=Image.LANCZOS)
        new_right_wing = right_wing.resize(
            (current_wing_width, h), resample=Image.LANCZOS)

        # Construct a new blank image with width = left_wing + body + right_wing
        new_width = current_wing_width + body_width + current_wing_width
        new_img = Image.new("RGBA", (new_width, h), (0, 0, 0, 0))

        # Paste the pieces back together
        # left wing at x=0
        new_img.paste(new_left_wing, (0, 0))
        # body follows right after left wing
        new_img.paste(body, (current_wing_width, 0))
        # right wing follows right after body
        new_img.paste(new_right_wing, (current_wing_width + body_width, 0))

        # save the narrowest image to 07.png, and from there wider ones up to 01.png
        filename = f"{(num_outputs - i):02d}.png"
        output_filename = os.path.join(output_dir, filename)
        new_img.save(output_filename, "PNG")

        if filename == '05.png':
            new_img.save(os.path.join(output_dir, "08.png"), "PNG")
        if filename == '03.png':
            new_img.save(os.path.join(output_dir, "09.png"), "PNG")
        if filename == '01.png':
            new_img.save(os.path.join(output_dir, "10.png"), "PNG")

        print(f"Saved {i}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Slices a butterfly image (top-down) into left wing, body, and right wing, "
                    "then resizes the wings into 10 different widths."
    )
    parser.add_argument("input_file", help="Path to the input PNG file.")
    parser.add_argument(
        "output_folder", help="Directory to save the output images.")
    parser.add_argument("body_width", type=int, help="Body width in pixels.")
    parser.add_argument("min_wing_width", type=int,
                        help="Minimum wing width in pixels.")
    parser.add_argument(
        "max_wing_width",
        help=(
            "Maximum wing width in pixels, or 'auto' to compute it as "
            '(image.width / 2) - body_width.'
        )
    )

    args = parser.parse_args()

    # If the user typed "auto" for max_wing_width, compute it
    if args.max_wing_width.lower() == "auto":
        with Image.open(args.input_file) as img:
            w, _ = img.size
        computed_max = (w // 2) - args.body_width
        if computed_max < args.min_wing_width:
            raise ValueError(
                f"Computed max wing width ({computed_max}) is less than min wing width ({
                    args.min_wing_width})."
            )
        max_wing_width = computed_max
    else:
        max_wing_width = int(args.max_wing_width)

    # Call the main slicing/resizing function
    slice_and_resize_butterfly(
        input_path=args.input_file,
        body_width=args.body_width,
        min_wing_width=args.min_wing_width,
        max_wing_width=max_wing_width,
        output_dir=args.output_folder
    )
