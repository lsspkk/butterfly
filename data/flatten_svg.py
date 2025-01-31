#!/usr/bin/env python3

import sys
import os
import re
import math
import xml.etree.ElementTree as ET

# svgpathtools for path parsing and Arc/Path classes
from svgpathtools import parse_path, Arc, Path, Line

###############################################################################
# 1) Utilities for parsing transforms into a 2D matrix (a,b,c,d,e,f).
#    We represent transforms in the standard SVG matrix form:
#         [ a  c  e ]
#         [ b  d  f ]
#         [ 0  0  1 ]
#    So the tuple is (a, b, c, d, e, f), meaning:
#       x' = a*x + c*y + e
#       y' = b*x + d*y + f
###############################################################################

def matrix_multiply(m1, m2):
    """
    Multiply two 2D transform matrices m1 x m2.
    Each matrix is a tuple (a, b, c, d, e, f).
    """
    a1, b1, c1, d1, e1, f1 = m1
    a2, b2, c2, d2, e2, f2 = m2
    return (
        a1*a2 + c1*b2,    # a
        b1*a2 + d1*b2,    # b
        a1*c2 + c1*d2,    # c
        b1*c2 + d1*d2,    # d
        a1*e2 + c1*f2 + e1,  # e
        b1*e2 + d1*f2 + f1   # f
    )

def matrix_identity():
    """Return the identity matrix (1,0,0,1,0,0)."""
    return (1.0, 0.0, 0.0, 1.0, 0.0, 0.0)

def matrix_translate(tx, ty=0.0):
    """Return matrix for translate(tx, ty)."""
    return (1.0, 0.0, 0.0, 1.0, tx, ty)

def matrix_scale(sx, sy=None):
    """Return matrix for scale(sx[, sy]). If sy is None, use sy=sx."""
    if sy is None:
        sy = sx
    return (sx, 0.0, 0.0, sy, 0.0, 0.0)

def matrix_rotate(angle_deg, cx=0.0, cy=0.0):
    """
    Return matrix for rotate(angle_deg[, cx, cy]).
    This is rotation about the point (cx, cy).
    """
    # Convert angle to radians
    a = math.radians(angle_deg)
    cosA = math.cos(a)
    sinA = math.sin(a)
    # If no center, it's standard rotation about origin
    #  [ cosA  -sinA  0 ]
    #  [ sinA   cosA  0 ]
    #  [  0       0   1 ]
    # If we have (cx,cy), we do:
    #   T(cx,cy) * R(a) * T(-cx,-cy)
    # We'll build that manually
    # R(a) about origin:
    rot = (cosA, sinA, -sinA, cosA, 0.0, 0.0)
    # Translate(-cx, -cy):
    t1 = matrix_translate(-cx, -cy)
    # Translate(cx, cy):
    t2 = matrix_translate(cx, cy)
    # Full = T2 * rot * T1
    return matrix_multiply(matrix_multiply(t2, rot), t1)

def matrix_custom(a, b, c, d, e, f):
    """matrix(a b c d e f) from 'matrix()' transform in SVG."""
    return (a, b, c, d, e, f)

def parse_transform_string(transform_str):
    """
    Parse an SVG transform string (e.g., "translate(10,20) rotate(45) scale(2)")
    into a single 2D matrix (a,b,c,d,e,f). 
    Order matters: transforms are applied from left to right in SVG spec.
    
    Supported commands: translate, scale, rotate, matrix.
    Skips unknown commands (skewX, skewY, etc.) for brevity.
    """
    # Overall approach:
    # 1) Find all commands of the form "<cmd>(...)"
    # 2) Parse the arguments
    # 3) Build a matrix for each
    # 4) Multiply them in sequence
    # Regex to capture something like "translate(...) rotate(...)"
    pattern = r'(translate|scale|rotate|matrix)\s*\(([^)]*)\)'
    matches = re.findall(pattern, transform_str)

    # Start with identity
    current_matrix = matrix_identity()

    for (cmd, args_str) in matches:
        # Split the args by commas or whitespace
        # e.g. "10,20" => ["10","20"]
        # e.g. "10 20" => ["10","20"]
        args = re.split(r'[ ,]+', args_str.strip())
        args = [x for x in args if x]  # remove empty strings

        if cmd == 'translate':
            # translate(tx[, ty])
            if len(args) == 1:
                tx = float(args[0])
                ty = 0.0
            else:
                tx = float(args[0])
                ty = float(args[1])
            m = matrix_translate(tx, ty)
            current_matrix = matrix_multiply(current_matrix, m)

        elif cmd == 'scale':
            # scale(sx[, sy])
            if len(args) == 1:
                sx = float(args[0])
                sy = None
            else:
                sx = float(args[0])
                sy = float(args[1])
            m = matrix_scale(sx, sy)
            current_matrix = matrix_multiply(current_matrix, m)

        elif cmd == 'rotate':
            # rotate(angle[, cx, cy])
            if len(args) == 1:
                angle = float(args[0])
                cx = 0.0
                cy = 0.0
            else:
                angle = float(args[0])
                cx = float(args[1])
                cy = float(args[2])
            m = matrix_rotate(angle, cx, cy)
            current_matrix = matrix_multiply(current_matrix, m)

        elif cmd == 'matrix':
            # matrix(a, b, c, d, e, f)
            # a = args[0], b=args[1], ...
            if len(args) == 6:
                a, b, c, d, e, f = map(float, args)
                m = matrix_custom(a, b, c, d, e, f)
                current_matrix = matrix_multiply(current_matrix, m)
        else:
            # ignoring unsupported transforms
            pass

    return current_matrix

###############################################################################
# 2) Functions for converting an <ellipse> to a svgpathtools.Path
#    and sampling a Path to apply a transform easily.
###############################################################################

def ellipse_to_path(cx, cy, rx, ry):
    """
    Create a Path for a full ellipse centered at (cx, cy) with radii (rx, ry),
    composed of two Arc segments. No rotation is included here; that will be
    handled by the transform matrix if present.
    """
    start = complex(cx + rx, cy)  # rightmost point
    mid   = complex(cx - rx, cy)  # leftmost point

    arc1 = Arc(start=start,
               radius=complex(rx, ry),
               rotation=0,         # arc's own rotation
               large_arc=True,
               sweep=False,
               end=mid)
    arc2 = Arc(start=mid,
               radius=complex(rx, ry),
               rotation=0,
               large_arc=True,
               sweep=False,
               end=start)
    return Path(arc1, arc2)


def sample_path_as_polyline(path, steps_per_segment=20):
    """
    Approximate any Path (which might include lines, cubic Beziers, arcs, etc.)
    as a polyline. We'll sample 'steps_per_segment' sub-points for each segment.
    Return a list of complex points.
    """
    points = []
    for segment in path:
        for i in range(steps_per_segment + 1):
            t = i / steps_per_segment
            points.append(segment.point(t))
    return points

def apply_matrix_to_point(z, matrix):
    """
    Apply the 2D transform matrix to a complex point z = x + i*y.
    matrix = (a, b, c, d, e, f).
    x' = a*x + c*y + e
    y' = b*x + d*y + f
    """
    (a, b, c, d, e, f) = matrix
    x, y = z.real, z.imag
    x_new = a*x + c*y + e
    y_new = b*x + d*y + f
    return complex(x_new, y_new)

def polyline_to_path(points):
    """
    Convert a list of complex points into a Path of straight lines:
      M P0 -> L P1 -> L P2 -> ...
    We'll build it as consecutive svgpathtools.Line segments.
    """
    if len(points) < 2:
        return Path()
    segments = []
    for i in range(len(points) - 1):
        seg = Line(points[i], points[i+1])
        segments.append(seg)
    return Path(*segments)

###############################################################################
# 3) Main flatten function: parse SVG, replace <ellipse> and <path> with a new
#    <path> having no 'transform' and a line-segment-based approximation.
###############################################################################

def flatten_svg_transforms(infile, outfile):
    """
    Parse the SVG in 'infile', flatten transforms on <ellipse> and <path> elements,
    and write new SVG to 'outfile' where geometry is directly in <path> (no transform).
    """
    tree = ET.parse(infile)
    root = tree.getroot()

    to_add = []
    to_remove = []

    # We'll iterate over all elements
    for elem in root.iter():
        # Strip namespace
        tag = elem.tag
        if '}' in tag:
            tag = tag.split('}', 1)[1]

        transform_str = elem.get('transform', '')

        # 1) Flatten <ellipse>
        if tag == 'ellipse':
            cx = float(elem.get('cx', '0'))
            cy = float(elem.get('cy', '0'))
            rx = float(elem.get('rx', '0'))
            ry = float(elem.get('ry', '0'))

            # Convert ellipse to a Path with 2 Arc segments
            raw_path = ellipse_to_path(cx, cy, rx, ry)

            # If there's a transform, parse it into a matrix
            matrix = parse_transform_string(transform_str)

            # Approximate the path as a polyline
            points = sample_path_as_polyline(raw_path, steps_per_segment=20)
            # Transform each point
            transformed_points = [apply_matrix_to_point(z, matrix) for z in points]
            # Build a new path from line segments
            new_path = polyline_to_path(transformed_points)

            # Create the new <path> element
            new_path_elem = ET.Element('path')
            # Copy style attributes
            for attr in ('fill', 'stroke', 'stroke-width',
                         'opacity', 'fill-opacity', 'stroke-opacity'):
                if attr in elem.attrib:
                    new_path_elem.set(attr, elem.get(attr))
            # Set 'd' to the new path geometry
            new_path_elem.set('d', new_path.d())

            # Insert new <path> before old <ellipse>
            parent = elem.getparent() if hasattr(elem, 'getparent') else None
            if parent is None:
                parent = root
            to_add.append((parent, elem, new_path_elem))
            to_remove.append((parent, elem))

        # 2) Flatten <path>
        elif tag == 'path':
            d_str = elem.get('d', '')
            if not d_str.strip():
                continue

            # Parse the path
            raw_path = parse_path(d_str)

            # If there's a transform, flatten it
            if transform_str.strip():
                matrix = parse_transform_string(transform_str)

                # Approximate path geometry
                points = sample_path_as_polyline(raw_path, steps_per_segment=20)
                # Transform each sampled point
                transformed_points = [apply_matrix_to_point(z, matrix) for z in points]
                # Build new path from line segments
                new_path = polyline_to_path(transformed_points)

                # Create new <path> element (no transform)
                new_path_elem = ET.Element('path')
                for attr in ('fill', 'stroke', 'stroke-width',
                             'opacity', 'fill-opacity', 'stroke-opacity'):
                    if attr in elem.attrib:
                        new_path_elem.set(attr, elem.get(attr))
                new_path_elem.set('d', new_path.d())

                parent = elem.getparent() if hasattr(elem, 'getparent') else None
                if parent is None:
                    parent = root
                to_add.append((parent, elem, new_path_elem))
                to_remove.append((parent, elem))

    # Perform insertions/removals
    for parent, old_elem, new_elem in to_add:
        idx = list(parent).index(old_elem)
        parent.insert(idx, new_elem)

    for parent, old_elem in to_remove:
        parent.remove(old_elem)

    ET.register_namespace('', 'http://www.w3.org/2000/svg')
    
    # Now write out, specifying we want XML output
    tree.write(outfile, xml_declaration=True, encoding='utf-8', method='xml')

###############################################################################
# 4) CLI entry point
###############################################################################

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python flatten_svg.py input.svg")
        sys.exit(1)

    infile = sys.argv[1]
    base, ext = os.path.splitext(infile)
    outfile = base + "_flat" + ext

    flatten_svg_transforms(infile, outfile)
    print(f"Done. Wrote flattened SVG to: {outfile}")
