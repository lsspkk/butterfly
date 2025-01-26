import os
import json
from PIL import Image

def create_spritesheet(input_image_path='.'):
    # Get all PNG files in the current folder
    images = [f for f in os.listdir(input_image_path) if f.endswith('.png')]
    images.sort()  # Sort files alphabetically

    if not images:
        print("No PNG images found in the current directory.")
        return

    # Open images and calculate the total height and max width
    opened_images = [Image.open(input_image_path+'/'+img) for img in images]
    total_height = sum(img.height for img in opened_images)
    max_width = max(img.width for img in opened_images)

    # Create a blank image for the spritesheet
    spritesheet = Image.new('RGBA', (max_width, total_height))

    # Paste images into the spritesheet
    y_offset = 0
    frame_data = {}
    for img, filename in zip(opened_images, images):
        spritesheet.paste(img, (0, y_offset))
        frame_data[filename] = {
            "frame": {"x": 0, "y": y_offset, "w": img.width, "h": img.height},
            "rotated": False,
            "trimmed": False,
            "spriteSourceSize": {"x": 0, "y": 0, "w": img.width, "h": img.height},
            "sourceSize": {"w": img.width, "h": img.height}
        }
        y_offset += img.height

    # Save the spritesheet image
    spritesheet_filename = input_image_path+".png"
    spritesheet.save(spritesheet_filename)

    # Create the spritesheet metadata
    spritesheet_data = {
        "frames": frame_data,
        "animations": {"all": list(frame_data.keys())},
        "meta": {
            "app": "https://chatgpt.com/",
            "version": "4",
            "image": spritesheet_filename,
            "format": "RGBA8888",
            "size": {"w": max_width, "h": total_height},
            "scale": "1"
        }
    }

    # Save the JSON metadata
    json_filename = input_image_path+"_sprites.json"
    with open(json_filename, 'w') as json_file:
        json.dump(spritesheet_data, json_file, indent=4)

    print(f"Spritesheet saved as {spritesheet_filename}")
    print(f"Metadata saved as {json_filename}")

if __name__ == "__main__":
    import sys, os

    if len(sys.argv) != 2:
        print(f"Usage: python {os.path.basename(__file__)} <input_image_path> ")
        sys.exit(1)

    input_image_path = sys.argv[1]
    create_spritesheet(input_image_path)
