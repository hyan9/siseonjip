// 사진 EXIF에서 GPS 좌표와 촬영 시각을 추출

export async function readPhotoMeta(file) {
  try {
    const exifr = await import('exifr');
    const data = await exifr.parse(file, {
      gps: true,
      pick: ['DateTimeOriginal', 'CreateDate', 'latitude', 'longitude'],
    });

    const lat = data?.latitude ?? null;
    const lng = data?.longitude ?? null;
    const takenAt = data?.DateTimeOriginal || data?.CreateDate || null;

    if (lat == null || lng == null) {
      return { status: 'empty', lat: null, lng: null, takenAt };
    }
    return { status: 'found', lat, lng, takenAt };
  } catch (error) {
    console.warn('[exif] 파싱 실패', error);
    return { status: 'error', lat: null, lng: null, takenAt: null };
  }
}
