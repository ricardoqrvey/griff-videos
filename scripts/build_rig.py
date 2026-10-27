"""Turn a single flat Gemini still of Griff into animation layers.

Outputs (same canvas size as the source, so layers stack with no offsets):
  body.png  - cut out of the background, with mouth, brows and raised hand removed
  hand.png  - the raised hand only, so it can rotate around the wrist
"""
import sys
from pathlib import Path

import cv2
import numpy as np

src, out = Path(sys.argv[1]), Path(sys.argv[2])
img = cv2.imread(str(src), cv2.IMREAD_COLOR)
h, w = img.shape[:2]
dark = img.max(axis=2) < 110  # black ink lines


def inpaint(image, mask, radius=6):
    mask = cv2.dilate(mask.astype(np.uint8) * 255, np.ones((5, 5), np.uint8))
    return cv2.inpaint(image, mask, radius, cv2.INPAINT_TELEA)


def box(x0, y0, x1, y1):
    m = np.zeros((h, w), bool)
    m[y0:y1, x0:x1] = True
    return m


# Gemini watermark sparkle on the right sleeve.
sleeve = img[960:1040, 780:870].astype(int)
magenta = np.array([169, 51, 200])  # BGR
spark = np.zeros((h, w), bool)
spark[960:1040, 780:870] = np.abs(sleeve - magenta).sum(axis=2) > 60
spark &= ~dark
img = inpaint(img, spark, 4)

# Mouth, chin line and lower philtrum: redrawn as vector on top.
mouth = box(462, 533, 594, 594) & dark
# Brows: redrawn as vector so they can raise and squint.
brows = (box(408, 296, 492, 332) | box(553, 284, 636, 324)) & dark
img = inpaint(img, mouth | brows, 7)

# Background: flood fill the flat grey from the borders.
bg = np.array([195, 203, 206])
dist = np.abs(img.astype(int) - bg).sum(axis=2)
near_bg = (dist < 30).astype(np.uint8)
_, labels = cv2.connectedComponents(near_bg, connectivity=4)
edge_labels = set(np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))) - {0}
bg_mask = np.isin(labels, list(edge_labels)) & (near_bg > 0)

alpha = np.where(bg_mask, 0, 255).astype(np.uint8)
# Anti-aliased silhouette: outlines are black, so alpha follows darkness against the grey.
ring = cv2.dilate((~bg_mask).astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool) & bg_mask
lum = img.mean(axis=2)
alpha[ring] = np.clip((bg.mean() - lum[ring]) / bg.mean() * 255 * 1.4, 0, 255).astype(np.uint8)
edge = ring | (cv2.dilate(bg_mask.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool) & ~bg_mask & ~dark & (dist < 90))
img[ring] = 0
alpha[edge & ~ring] = np.clip(dist[edge & ~ring] / 90 * 255, 0, 255).astype(np.uint8)
img[edge & ~ring] = 0

rgba = np.dstack([img, alpha])

# Raised hand: everything above the cuff on the left edge.
hand_mask = box(0, 440, 205, 697)
hand = rgba.copy()
hand[~hand_mask] = 0
body = rgba.copy()
body[hand_mask] = 0

out.mkdir(parents=True, exist_ok=True)
cv2.imwrite(str(out / "body.png"), body)
cv2.imwrite(str(out / "hand.png"), hand)
print("ok", w, h)
