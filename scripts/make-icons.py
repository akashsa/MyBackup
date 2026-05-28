"""Generate placeholder PWA icons (mouse-ears silhouette on a navy circle)."""
from PIL import Image, ImageDraw

NAVY = (15, 23, 42, 255)
INK = (230, 236, 255, 255)
ACCENT = (252, 211, 77, 255)


def make_icon(size: int, path: str) -> None:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # background rounded square (mask-friendly)
    d.rounded_rectangle((0, 0, size, size), radius=int(size * 0.22), fill=NAVY)

    cx, cy = size / 2, size / 2 + size * 0.05
    head_r = size * 0.28
    ear_r = size * 0.18
    # mouse silhouette
    d.ellipse(
        (cx - ear_r * 2.2, cy - head_r * 1.55, cx - ear_r * 0.2, cy - head_r * 0.05),
        fill=INK,
    )
    d.ellipse(
        (cx + ear_r * 0.2, cy - head_r * 1.55, cx + ear_r * 2.2, cy - head_r * 0.05),
        fill=INK,
    )
    d.ellipse((cx - head_r, cy - head_r, cx + head_r, cy + head_r), fill=INK)
    # star accent
    star_r = size * 0.08
    star_cx, star_cy = cx + size * 0.18, cy + size * 0.22
    d.regular_polygon((star_cx, star_cy, star_r), n_sides=5, fill=ACCENT)
    img.save(path, "PNG")


if __name__ == "__main__":
    import os, sys
    out_dir = sys.argv[1] if len(sys.argv) > 1 else "public"
    os.makedirs(out_dir, exist_ok=True)
    make_icon(192, os.path.join(out_dir, "icon-192.png"))
    make_icon(512, os.path.join(out_dir, "icon-512.png"))
    make_icon(180, os.path.join(out_dir, "apple-touch-icon.png"))
    print("wrote icons to", out_dir)
