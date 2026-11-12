# Recolours the rig toward another art style's palette (Ep. 2: Griff as painted in
# the scene videos). Every fill in the rig data that sits near one of the rig's key
# colours moves by that key's shift in Lab, so shading steps survive.
# Writes {rig hex: new hex}. Needs numpy.
import json, re, sys
import numpy as np

rig = json.load(open("src/data/griff.rig.json"))
out = sys.argv[1] if len(sys.argv) > 1 else "src/data/griff.palette.ep2.json"
# rig key colour → the same part in the video (sampled from public/ep2/scene1.mp4)
KEYS = {
    "#e5cf98": "#d5c192",  # fur
    "#cf2e9e": "#99347b",  # jacket sleeves, collar, cuffs
    "#3ebccd": "#60b1b8",  # vest
    "#c79a35": "#ab8f58",  # horn, light
    "#a5802f": "#8b7547",  # horn, dark
    "#2bc4d4": "#85969a",  # glasses frame (front)
    "#68adb8": "#85969a",  # glasses frame (3/4)
    "#5fb3c6": "#85969a",  # glasses frame (profile)
    "#b58477": "#a58074",  # inner ear
    "#524741": "#584d46",  # nose
}

def lab(h):
    c = np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)]) / 255
    c = np.where(c > 0.04045, ((c + 0.055) / 1.055) ** 2.4, c / 12.92)
    x, y, z = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]]) @ c / [0.95047, 1, 1.08883]
    f = lambda t: np.where(t > 0.008856, np.cbrt(t), 7.787 * t + 16 / 116)
    fx, fy, fz = f(x), f(y), f(z)
    return np.array([116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)])

def hexof(L):
    fy = (L[0] + 16) / 116; fx = fy + L[1] / 500; fz = fy - L[2] / 200
    g = lambda t: np.where(t ** 3 > 0.008856, t ** 3, (t - 16 / 116) / 7.787)
    xyz = np.array([g(fx) * 0.95047, g(fy), g(fz) * 1.08883])
    c = np.array([[3.2406, -1.5372, -0.4986], [-0.9689, 1.8758, 0.0415], [0.0557, -0.2040, 1.0570]]) @ xyz
    c = np.where(c > 0.0031308, 1.055 * np.clip(c, 0, None) ** (1 / 2.4) - 0.055, 12.92 * c)
    return "#" + "".join(f"{int(round(v)):02x}" for v in np.clip(c * 255, 0, 255))

colours = set(m.lower() for m in re.findall(r'#[0-9a-fA-F]{6}\b', json.dumps(rig)))
keys = [(lab(k), lab(v)) for k, v in KEYS.items()]
res = {}
for h in sorted(colours):
    L = lab(h)
    d = [np.linalg.norm(L - k) for k, _ in keys]
    i = int(np.argmin(d))
    if d[i] < 20:
        res[h] = hexof(L + keys[i][1] - keys[i][0])
json.dump(res, open(out, "w"), indent=0)
print(len(res), "of", len(colours), "colours moved")
