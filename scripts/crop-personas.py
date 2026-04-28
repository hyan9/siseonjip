"""
Persona PNG 자동 크롭.

NotebookLM PDF에서 추출된 PNG에는
  ① 백색/연회색 "카드" 프레임 + 모서리 그림자
  ② 다음 페이지 항목 텍스트/UI 잔상 (chlorophyll: Tech Note, cyberpunk: data-theme)
이 같이 들어있어 UI에서 카드-속-카드처럼 보이거나 글자가 비침.

크롭 절차:
  1) 잔상 들어있는 이미지(chlorophyll, cyberpunk)는 상단 비율로 미리 잘라냄.
  2) 채도 또는 어두움 기준으로 콘텐츠(고양이) bbox 자동 검출.
  3) bbox로 잘라내고 8% 패딩한 정사각형 캔버스에 배치.
  4) 256x256으로 정규화.

배경은 투명 — 컴포넌트 bg(persona별 톤)가 그대로 보임.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent / "public" / "personas"

# 잔상 들어있는 이미지: 상단 비율로 미리 잘라냄
HARD_TOP_RATIO = {
    "chlorophyll.png": 0.62,
    "cyberpunk.png":   0.58,
    "mackerel.png":    0.74,
}


def content_bbox(img: Image.Image) -> tuple:
    """채도 50+ 또는 명도 130 이하 픽셀의 bbox."""
    rgb = img.convert("RGB")
    w, h = rgb.size
    px = rgb.load()
    min_x, min_y, max_x, max_y = w, h, 0, 0
    found = False
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            mx = max(r, g, b); mn = min(r, g, b)
            sat = mx - mn
            L = (r + g + b) / 3
            if L < 135 or sat > 45:
                if x < min_x: min_x = x
                if y < min_y: min_y = y
                if x > max_x: max_x = x
                if y > max_y: max_y = y
                found = True
    if not found:
        return (0, 0, w, h)
    pad = 2
    return (
        max(0, min_x - pad),
        max(0, min_y - pad),
        min(w, max_x + pad + 1),
        min(h, max_y + pad + 1),
    )


def remove_card_bg(img: Image.Image) -> Image.Image:
    """연한 배경(L>225, S<22)을 투명 처리."""
    img = img.convert("RGBA")
    rgb = img.convert("RGB")
    px = img.load()
    px_rgb = rgb.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b = px_rgb[x, y]
            mx = max(r, g, b); mn = min(r, g, b)
            sat = mx - mn
            L = (r + g + b) / 3
            if L >= 235 and sat < 22:
                px[x, y] = (0, 0, 0, 0)
            elif L >= 215 and sat < 16:
                # 그림자 톤 → 알파 페이드
                fade = int(255 * (235 - L) / 20)
                pr, pg, pb, pa = px[x, y]
                px[x, y] = (pr, pg, pb, max(0, min(pa, fade)))
    return img


def to_square(img: Image.Image, target=256) -> Image.Image:
    w, h = img.size
    side = max(w, h)
    pad = int(side * 0.08)
    canvas_side = side + pad * 2
    canvas = Image.new("RGBA", (canvas_side, canvas_side), (0, 0, 0, 0))
    if img.mode != "RGBA":
        img = img.convert("RGBA")
    canvas.paste(img, ((canvas_side - w) // 2, (canvas_side - h) // 2), img)
    if canvas_side != target:
        canvas = canvas.resize((target, target), Image.LANCZOS)
    return canvas


def main():
    for png in sorted(ROOT.glob("*.png")):
        img = Image.open(png)
        w0, h0 = img.size
        # 1) 잔상 들어있는 이미지는 상단만 사용
        ratio = HARD_TOP_RATIO.get(png.name)
        if ratio:
            img = img.crop((0, 0, w0, int(h0 * ratio)))
        # 2) 콘텐츠 bbox로 트림
        bbox = content_bbox(img)
        cropped = img.crop(bbox)
        # 3) 카드 배경 투명화
        cleaned = remove_card_bg(cropped)
        # 4) 정사각형 캔버스 + 정규화
        out = to_square(cleaned, target=256)
        out.save(png, optimize=True)
        print(f"{png.name}: {w0}x{h0} bbox{bbox} -> 256x256")


if __name__ == "__main__":
    main()
