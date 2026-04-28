"""
Persona PNG 재패딩.

기존 crop-personas.py가 8% 패딩만 줘서 PNG 안에서 고양이가 캔버스의 84%를 차지.
타일 안에서 고양이가 가장자리까지 닿는 듯 보이는 시각적 잘림 문제 발생.

이 스크립트는 현재 256x256 PNG에서 콘텐츠 bbox를 다시 검출해서
22% 패딩으로 재처리 — 고양이가 캔버스의 ~70% 차지하게 됨.
모든 페르소나가 동일한 여백을 갖게 되어 시각적으로 일관됨.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent / "public" / "personas"
PADDING_RATIO = 0.22  # 양 옆 22% 여백 → 고양이가 캔버스의 1/(1+2*0.22)=68% 차지
TARGET = 256


def content_bbox(img: Image.Image) -> tuple | None:
    """알파 채널 기준 bbox. 투명 배경 PNG의 실제 콘텐츠 영역."""
    if img.mode != "RGBA":
        img = img.convert("RGBA")
    return img.getbbox()


def repad(img: Image.Image, target: int = TARGET, padding_ratio: float = PADDING_RATIO) -> Image.Image:
    if img.mode != "RGBA":
        img = img.convert("RGBA")
    bbox = content_bbox(img)
    if not bbox:
        return img
    cropped = img.crop(bbox)
    w, h = cropped.size
    side = max(w, h)
    pad = int(side * padding_ratio)
    canvas_side = side + pad * 2
    canvas = Image.new("RGBA", (canvas_side, canvas_side), (0, 0, 0, 0))
    offset_x = (canvas_side - w) // 2
    offset_y = (canvas_side - h) // 2
    canvas.paste(cropped, (offset_x, offset_y), cropped)
    if canvas_side != target:
        canvas = canvas.resize((target, target), Image.LANCZOS)
    return canvas


def main():
    for png in sorted(ROOT.glob("*.png")):
        img = Image.open(png)
        w0, h0 = img.size
        bbox = content_bbox(img)
        if not bbox:
            print(f"{png.name}: 콘텐츠 없음, 스킵")
            continue
        bw = bbox[2] - bbox[0]
        bh = bbox[3] - bbox[1]
        out = repad(img, target=TARGET, padding_ratio=PADDING_RATIO)
        out.save(png, optimize=True)
        fill = max(bw, bh) / TARGET * 100
        print(f"{png.name}: {w0}x{h0} bbox{bbox} (cat {bw}x{bh}, was {fill:.0f}% of canvas) -> {TARGET}x{TARGET} with {int(PADDING_RATIO*100)}% padding")


if __name__ == "__main__":
    main()
