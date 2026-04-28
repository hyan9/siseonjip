"""
PDF 6페이지에서 4개 페르소나(점박이·라벤더·엽록소·사이버펑크) 정밀 재추출.

이전 스크립트들은 카드 경계선을 콘텐츠로 인식해서 잘못된 bbox 생성.
이번엔:
  1) 카드 안에서 고양이 영역만 잡기 (카드 상단 35%는 색상+라벨, 무시)
  2) 카드 가장자리 픽셀 무시 (그림자/경계선이 어두운 픽셀로 잡히는 문제)
  3) 검출된 cat bbox에 50% 패딩 추가
"""
import sys
sys.stdout.reconfigure(encoding="utf-8")
from pathlib import Path
from PIL import Image
import fitz

ROOT = Path(__file__).resolve().parent.parent
PDF_PATH = Path(r"c:/Users/LG/Desktop/KaDenNyang_Poetic_Diary.pdf")
OUT_DIR = ROOT / "public" / "personas"

# PDF 6페이지 200dpi 렌더 (3823x2134) 기준 카드 좌표
# 행 2 = 점박이, 라벤더, 엽록소, 사이버펑크, 외계
ROW2 = (980, 1830)
CARDS = {
    "spotted":     (75, 760),
    "lavender":    (775, 1460),
    "chlorophyll": (1475, 2160),
    "cyberpunk":   (2175, 2860),
}
# 카드 내부 안전 영역 (가장자리 그림자/경계선 무시) — 카드 폭/높이 대비 비율
EDGE_INSET = 0.04
# 색상+라벨 영역 (카드 상단 비율)
TOP_SKIP = 0.32


def detect_cat(card: Image.Image) -> tuple:
    """카드에서 고양이 픽셀 bbox 검출.

    카드 상단 32%(색상·라벨), 가장자리 4%(그림자) 제외하고 안쪽에서만 검출.
    어두운(L<140) 또는 채도 높은(sat>60) 픽셀이 고양이.
    """
    rgb = card.convert("RGB")
    px = rgb.load()
    w, h = rgb.size
    inset_x = int(w * EDGE_INSET)
    inset_y = int(h * EDGE_INSET)
    skip_top = int(h * TOP_SKIP)

    min_x, min_y, max_x, max_y = w, h, 0, 0
    found = False
    for y in range(max(skip_top, inset_y), h - inset_y):
        for x in range(inset_x, w - inset_x):
            r, g, b = px[x, y]
            mx = max(r, g, b); mn = min(r, g, b)
            sat = mx - mn
            L = (r + g + b) / 3
            if L < 140 or sat > 60:
                if x < min_x: min_x = x
                if y < min_y: min_y = y
                if x > max_x: max_x = x
                if y > max_y: max_y = y
                found = True
    if not found:
        return None
    return (min_x, min_y, max_x + 1, max_y + 1)


def make_persona_png(card: Image.Image, cat_bbox: tuple, padding_ratio: float = 0.45) -> Image.Image:
    """검출된 고양이를 padding_ratio 마진으로 256x256 투명 PNG."""
    cropped = card.crop(cat_bbox).convert("RGBA")
    # 카드 흰색 배경 → 투명
    rgb = cropped.convert("RGB")
    rgb_px = rgb.load()
    rgba_px = cropped.load()
    w, h = cropped.size
    for y in range(h):
        for x in range(w):
            r, g, b = rgb_px[x, y]
            mx = max(r, g, b); mn = min(r, g, b)
            sat = mx - mn
            L = (r + g + b) / 3
            if L >= 235 and sat < 22:
                rgba_px[x, y] = (0, 0, 0, 0)
            elif L >= 215 and sat < 16:
                fade = int(255 * (235 - L) / 20)
                pr, pg, pb, pa = rgba_px[x, y]
                rgba_px[x, y] = (pr, pg, pb, max(0, min(pa, fade)))

    # 투명화 후 다시 bbox로 trim — 흰색 마진 제거
    bbox = cropped.getbbox()
    if bbox:
        cropped = cropped.crop(bbox)
        w, h = cropped.size

    side = max(w, h)
    pad = int(side * padding_ratio)
    canvas_side = side + pad * 2
    canvas = Image.new("RGBA", (canvas_side, canvas_side), (0, 0, 0, 0))
    canvas.paste(cropped, ((canvas_side - w) // 2, (canvas_side - h) // 2), cropped)
    canvas = canvas.resize((256, 256), Image.LANCZOS)
    return canvas


def main():
    doc = fitz.open(PDF_PATH)
    page = doc[5]  # 6페이지
    pix = page.get_pixmap(dpi=200)
    page_img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    print(f"page 6 rendered: {pix.width}x{pix.height}")

    y0, y1 = ROW2
    for name, (x0, x1) in CARDS.items():
        card = page_img.crop((x0, y0, x1, y1))
        # 디버그용 카드 자체도 저장
        card.save(ROOT / "tmp-pdf" / f"_card_{name}.png")
        cat_bbox = detect_cat(card)
        if not cat_bbox:
            print(f"{name}: 검출 실패")
            continue
        cl, ct, cr, cb = cat_bbox
        cw = cr - cl
        ch = cb - ct
        print(f"{name}: card={card.size}, cat=({cl},{ct},{cr},{cb}) {cw}x{ch}")
        # 22% 패딩 — 다른 6개 페르소나 (68-69% fill)와 사이즈 맞춤
        out = make_persona_png(card, cat_bbox, padding_ratio=0.22)
        out.save(OUT_DIR / f"{name}-v2.png", optimize=True)
        # 검수용 — top/bottom margin 확인
        bbox2 = out.getbbox()
        if bbox2:
            l, t, r, b = bbox2
            print(f"  -> {name}-v2.png: top_margin={t}px({t/256*100:.1f}%), bottom={256-b}px({(256-b)/256*100:.1f}%)")


if __name__ == "__main__":
    main()
