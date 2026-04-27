// 사진 EXIF에서 GPS 좌표, 촬영 시각, 카메라/렌즈 정보를 추출
// 주의: iOS Safari는 보안/프라이버시 이유로 업로드 시 EXIF 일부를 제거하는 경우가 있음.
// 그럴 땐 RecordScreen의 "현재 위치 사용" 버튼으로 fallback.

export async function readPhotoMeta(file) {
  try {
    const exifr = await import('exifr');
    const data = await exifr.parse(file).catch(() => null);

    const lat = data?.latitude ?? null;
    const lng = data?.longitude ?? null;
    const takenAt = data?.DateTimeOriginal || data?.CreateDate || null;
    const cameraMake = data?.Make ? String(data.Make).trim() : null;
    const cameraModel = data?.Model ? String(data.Model).trim() : null;
    const lens = data?.LensModel || data?.Lens || data?.LensInfo
      ? String(data.LensModel || data.Lens || data.LensInfo).trim()
      : null;

    if (lat == null || lng == null) {
      return { status: 'empty', lat: null, lng: null, takenAt, cameraMake, cameraModel, lens };
    }
    return { status: 'found', lat, lng, takenAt, cameraMake, cameraModel, lens };
  } catch (error) {
    console.warn('[exif] 파싱 실패', error);
    return { status: 'error', lat: null, lng: null, takenAt: null, cameraMake: null, cameraModel: null, lens: null };
  }
}
