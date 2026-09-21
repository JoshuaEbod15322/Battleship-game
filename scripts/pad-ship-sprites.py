"""Pad ship top/destroy sprites to board cell aspect (size:1) so they don't stretch."""
from __future__ import annotations

import struct
import zlib
from pathlib import Path

SHIP_SIZES = {
    "carrier": 5,
    "battleship": 4,
    "cruiser": 3,
    "submarine": 3,
    "destroyer": 2,
}

ROOT = Path(__file__).resolve().parents[1] / "src" / "assets" / "ship"


def paeth(a: int, b: int, c: int) -> int:
    p = a + b - c
    pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
    if pa <= pb and pa <= pc:
        return a
    if pb <= pc:
        return b
    return c


def read_png(path: Path) -> tuple[int, int, bytearray]:
    data = path.read_bytes()
    assert data[:8] == b"\x89PNG\r\n\x1a\n"
    pos = 8
    w = h = ctype = 0
    idat = b""
    while pos < len(data):
        ln = struct.unpack(">I", data[pos : pos + 4])[0]
        typ = data[pos + 4 : pos + 8]
        chunk = data[pos + 8 : pos + 8 + ln]
        if typ == b"IHDR":
            w, h, _bit, ctype = struct.unpack(">IIBB", chunk[:10])
        elif typ == b"IDAT":
            idat += chunk
        elif typ == b"IEND":
            break
        pos += 12 + ln
    if ctype != 6:
        raise SystemExit(f"{path.name}: expected RGBA, got color type {ctype}")
    raw = zlib.decompress(idat)
    bpp = 4
    stride = 1 + w * bpp
    rows: list[bytearray] = []
    prev = bytearray(w * bpp)
    for y in range(h):
        f = raw[y * stride]
        scan = bytearray(raw[y * stride + 1 : (y + 1) * stride])
        if f == 1:
            for i in range(len(scan)):
                scan[i] = (scan[i] + (scan[i - bpp] if i >= bpp else 0)) & 255
        elif f == 2:
            for i in range(len(scan)):
                scan[i] = (scan[i] + prev[i]) & 255
        elif f == 3:
            for i in range(len(scan)):
                a = scan[i - bpp] if i >= bpp else 0
                scan[i] = (scan[i] + ((a + prev[i]) // 2)) & 255
        elif f == 4:
            for i in range(len(scan)):
                a = scan[i - bpp] if i >= bpp else 0
                b = prev[i]
                c = prev[i - bpp] if i >= bpp else 0
                scan[i] = (scan[i] + paeth(a, b, c)) & 255
        elif f != 0:
            raise SystemExit(f"{path.name}: unsupported filter {f}")
        rows.append(scan)
        prev = scan
    pixels = bytearray()
    for row in rows:
        pixels.extend(row)
    return w, h, pixels


def write_png(path: Path, w: int, h: int, pixels: bytes) -> None:
    def chunk(tag: bytes, payload: bytes) -> bytes:
        return (
            struct.pack(">I", len(payload))
            + tag
            + payload
            + struct.pack(">I", zlib.crc32(tag + payload) & 0xFFFFFFFF)
        )

    raw = bytearray()
    row_bytes = w * 4
    for y in range(h):
        raw.append(0)
        raw.extend(pixels[y * row_bytes : (y + 1) * row_bytes])
    ihdr = struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0)
    png = (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", ihdr)
        + chunk(b"IDAT", zlib.compress(bytes(raw), 9))
        + chunk(b"IEND", b"")
    )
    path.write_bytes(png)


def tight_bbox(w: int, h: int, pixels: bytearray, alpha_min: int = 8) -> tuple[int, int, int, int]:
    min_x, min_y, max_x, max_y = w, h, -1, -1
    for y in range(h):
        row = y * w * 4
        for x in range(w):
            if pixels[row + x * 4 + 3] >= alpha_min:
                if x < min_x:
                    min_x = x
                if x > max_x:
                    max_x = x
                if y < min_y:
                    min_y = y
                if y > max_y:
                    max_y = y
    if max_x < 0:
        return 0, 0, w, h
    return min_x, min_y, max_x + 1, max_y + 1


def crop(w: int, h: int, pixels: bytearray, x0: int, y0: int, x1: int, y1: int) -> tuple[int, int, bytearray]:
    nw, nh = x1 - x0, y1 - y0
    out = bytearray(nw * nh * 4)
    for y in range(nh):
        src = ((y0 + y) * w + x0) * 4
        dst = y * nw * 4
        out[dst : dst + nw * 4] = pixels[src : src + nw * 4]
    return nw, nh, out


def pad_to_aspect(w: int, h: int, pixels: bytearray, aspect: float) -> tuple[int, int, bytearray]:
    current = w / h
    if abs(current - aspect) < 0.01:
        return w, h, pixels
    if current > aspect:
        new_h = max(h, int(round(w / aspect)))
        new_w = w
    else:
        new_w = max(w, int(round(h * aspect)))
        new_h = h
    out = bytearray(new_w * new_h * 4)  # transparent
    ox = (new_w - w) // 2
    oy = (new_h - h) // 2
    for y in range(h):
        src = y * w * 4
        dst = ((oy + y) * new_w + ox) * 4
        out[dst : dst + w * 4] = pixels[src : src + w * 4]
    return new_w, new_h, out


def process(path: Path, size: int) -> None:
    w, h, pixels = read_png(path)
    x0, y0, x1, y1 = tight_bbox(w, h, pixels)
    # keep a 2px transparent margin so rotation doesn't clip hull edges
    pad = 2
    x0, y0 = max(0, x0 - pad), max(0, y0 - pad)
    x1, y1 = min(w, x1 + pad), min(h, y1 + pad)
    w, h, pixels = crop(w, h, pixels, x0, y0, x1, y1)
    w, h, pixels = pad_to_aspect(w, h, pixels, float(size))
    write_png(path, w, h, pixels)
    print(f"{path.name:28} -> {w}x{h}  aspect={w/h:.3f}  target={size}:1")


def main() -> None:
    for path in sorted(ROOT.glob("*.png")):
        name = path.name
        if not (name.endswith("-top.png") or name.endswith("-destroy.png")):
            continue
        ship_id = name.split("-")[0]
        size = SHIP_SIZES[ship_id]
        process(path, size)


if __name__ == "__main__":
    main()
