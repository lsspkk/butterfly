from PIL import Image, ImageDraw, ImageChops
import math, os, sys
import random

def swirl_once(image, swirl_center, swirl_amount):
    """
    Swirl the image around a single center by a given swirl_amount.
    Returns a new, swirled image (RGBA).
    """
    width, height = image.size
    cx, cy = swirl_center
    max_r = min(width, height) / 2.0

    new_img = Image.new("RGBA", (width, height))
    src_pixels = image.load()
    dst_pixels = new_img.load()

    for y in range(height):
        for x in range(width):
            dx = x - cx
            dy = y - cy
            r = math.sqrt(dx*dx + dy*dy)

            if r == 0:
                dst_pixels[x, y] = src_pixels[x, y]
                continue

            theta = math.atan2(dy, dx)
            frac = min(r / max_r, 1.0)
            new_theta = theta + frac * swirl_amount

            nx = cx + r * math.cos(new_theta)
            ny = cy + r * math.sin(new_theta)
            nx_int, ny_int = int(round(nx)), int(round(ny))

            if 0 <= nx_int < width and 0 <= ny_int < height:
                dst_pixels[x, y] = src_pixels[nx_int, ny_int]
            else:
                dst_pixels[x, y] = (0, 0, 0, 0)

    return new_img

def swirl_image_with_three_centers(image, frame_index, total_frames, total_swirl_strength):
    """
    Applies swirling around three distinct centers arranged in a triangle.
    Each center is half-way between the bubble center and the edge.
    """
    width, height = image.size
    cx, cy = width / 2.0, height / 2.0
    max_r = min(cx, cy)
    swirl_radius = max_r / 2.0

    swirl_centers = []
    for i in range(3):
        angle_deg = 120 * i
        angle_rad = math.radians(angle_deg)
        sx = cx + swirl_radius * math.cos(angle_rad)
        sy = cy + swirl_radius * math.sin(angle_rad)
        swirl_centers.append((sx, sy))

    if total_frames > 1:
        swirl_factor = (frame_index / (total_frames - 1))
    else:
        swirl_factor = 1.0
    swirl_amount_for_this_frame = total_swirl_strength * swirl_factor

    swirled_img = image
    for center in swirl_centers:
        swirled_img = swirl_once(swirled_img, center, swirl_amount_for_this_frame)

    return swirled_img

def create_drops_data(num_drops, center, max_r):
    """
    Generate per-drop parameters for 5 drops that are:
      - Evenly spaced around 360°, but with small random offset
      - Start at ~2/3 * max_r, end near the edge
      - Each has a random arc between e.g. 60°..120°
      - Each starts small and grows
    """
    drops = []
    cx, cy = center

    random.seed(42)  # for reproducibility; remove or change if you want random each run

    base_angle_step = 360.0 / num_drops

    for i in range(num_drops):
        # Evenly spaced around the circle
        base_angle = i * base_angle_step
        # Small random offset ±10 degrees
        start_angle_deg = base_angle + random.uniform(-10, 10)

        # Arc of travel
        arc_degrees = random.uniform(60, 120)  # different travel arcs

        # Start radius near 2/3 of bubble radius
        start_r = (2.0/3.0)*max_r + random.uniform(-0.05*max_r, 0.05*max_r)
        # End radius near the edge
        end_r = max_r + random.uniform(-0.1*max_r, 0.05*max_r)

        # Drops start tiny (2..4 px) and grow (8..12 px)
        start_size = random.uniform(2.0, 4.0)
        end_size = random.uniform(8.0, 12.0)

        drops.append({
            "start_angle_deg": start_angle_deg,
            "arc_degrees": arc_degrees,
            "start_r": start_r,
            "end_r": end_r,
            "start_size": start_size,
            "end_size": end_size
        })

    return drops

def draw_teardrop(draw, x, y, orientation_deg, size, color):
    """
    Draw a simple teardrop shape at (x, y), oriented by orientation_deg (degrees).
    'size' roughly controls how large the drop is.

    We'll do a rough polygon: top pointed, bottom round-ish.

    Local coords (before rotation):
       (0, -size)          <- top tip
       ( size*0.6, size*0.4)
       (0,  size)
       (-size*0.6, size*0.4)
    Then rotate about (0,0) by orientation_deg, and translate to (x, y).
    """
    local_points = [
        (0, -size),
        ( size*0.6,  size*0.4),
        (0,  size),
        (-size*0.6,  size*0.4)
    ]
    rad = math.radians(orientation_deg)
    cosA = math.cos(rad)
    sinA = math.sin(rad)

    global_points = []
    for (lx, ly) in local_points:
        rx = lx*cosA - ly*sinA
        ry = lx*sinA + ly*cosA
        global_points.append((x + rx, y + ry))

    draw.polygon(global_points, fill=color)

def draw_flying_drops(image, frame_index, total_frames, drops_data, center):
    """
    Draw each drop as a water-drop shape.
    - Evenly spaced starting angles + random offset
    - Moves from (start_r, start_angle) to (end_r, start_angle+arc)
    - Grows in size from start_size to end_size
    - Fades out from alpha=255 to alpha=0
    """
    draw = ImageDraw.Draw(image, "RGBA")
    cx, cy = center
    if total_frames > 1:
        frac = frame_index / (total_frames - 1)
    else:
        frac = 1.0

    # alpha fades from 255 -> 0
    alpha = int(255 * (1.0 - frac))

    for drop in drops_data:
        # Unpack data
        start_angle_deg = drop["start_angle_deg"]
        arc_degrees = drop["arc_degrees"]
        start_r = drop["start_r"]
        end_r = drop["end_r"]
        start_size = drop["start_size"]
        end_size = drop["end_size"]

        # Current angle + radius
        current_angle_deg = start_angle_deg + arc_degrees * frac
        current_r = start_r + (end_r - start_r) * frac

        # Current size
        current_size = start_size + (end_size - start_size) * frac

        # Coordinates of drop center
        x = cx + current_r * math.cos(math.radians(current_angle_deg))
        y = cy + current_r * math.sin(math.radians(current_angle_deg))

        # Orientation
        orientation_deg = current_angle_deg

        # Slightly bluish-white color
        color = (230, 240, 255, alpha)

        # Draw
        draw_teardrop(draw, x, y, orientation_deg, current_size, color)

def create_burst_sprites(
    input_image_path="bubble.png",
    output_folder=".",
    output_prefix="break",
    frames=10,
    swirl_strength=6.28
):
    """
    Creates a sequence of sprites showing:
      1) A soap bubble with 3 swirl vortices
      2) A growing hole in the center
      3) Five water-drop shapes that start small & grow, spaced around 360° with random offsets
    """
    # 1) Load original bubble
    bubble = Image.open(input_image_path).convert("RGBA")
    width, height = bubble.size
    cx, cy = width//2, height//2
    max_radius = min(cx, cy)

    # 2) Create random drop flight parameters once
    num_drops = 5
    drops_data = create_drops_data(num_drops, (cx, cy), max_radius)

    for i in range(frames):
        # a) Swirl
        swirled = swirl_image_with_three_centers(
            image=bubble,
            frame_index=i,
            total_frames=frames,
            total_swirl_strength=swirl_strength
        )

        # b) Create mask for the hole
        mask = Image.new("L", (width, height), color=255)
        draw_mask = ImageDraw.Draw(mask)
        radius = int(((i + 1)/frames) * max_radius)
        draw_mask.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), fill=0)

        swirled_alpha = swirled.split()[3]
        combined_alpha = ImageChops.multiply(swirled_alpha, mask)
        final_frame = swirled.copy()
        final_frame.putalpha(combined_alpha)

        # c) Draw the flying drops (small -> big, fade out)
        draw_flying_drops(
            image=final_frame,
            frame_index=i,
            total_frames=frames,
            drops_data=drops_data,
            center=(cx, cy)
        )

        # d) Save
        filename = f"{output_folder}/{i+1:02d}-{output_prefix}.png"
        final_frame.save(filename)
        print(f"Saved {filename}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(f"Usage: python {os.path.basename(__file__)} <input_image_path> <output_folder>")
        sys.exit(1)

    input_image_path = sys.argv[1]
    output_folder = sys.argv[2]

    os.makedirs(output_folder, exist_ok=True)

    create_burst_sprites(
        input_image_path=input_image_path,
        output_folder=output_folder,
        output_prefix="break",
        frames=10,
        swirl_strength=1.28
    )
