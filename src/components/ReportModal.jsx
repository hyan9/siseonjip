import { useState } from 'react';
import { useData } from '../lib/data-context';
import { reportContent } from '../lib/db';
import Icon from './Icon';

const REPORT_REASONS = [
  { id: 'spam', label: '스팸 / 광고' },
  { id: 'harassment', label: '괴롭힘 / 혐오' },
  { id: 'sexual', label: '부적절한 성적 콘텐츠' },
  { id: 'violence', label: '폭력 / 위험' },
  { id: 'misinformation', label: '허위 정보' },
  { id: 'copyright', label: '저작권 침해' },
  { id: 'other', label: '기타' },
];

export default function ReportModal({ target, onClose }) {
  const { userId } = useData();
  const [reason, setReason] = useState('spam');
  const [detail, setDetail] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (!userId) return;
    setBusy(true);
    try {
      await reportContent(userId, target, reason, detail);
      setDone(true);
      setTimeout(onClose, 1200);
    } catch (err) {
      alert('신고 실패: ' + err.message);
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-[400px] rounded-[24px] bg-[var(--surface)] p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-[20px] font-extrabold tracking-[-0.06em]">콘텐츠 신고</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-2)]"
          >
            <Icon name="x" size={14} />
          </button>
        </div>

        {done ? (
          <p className="mt-4 rounded-[16px] bg-green-50 p-4 text-sm text-green-800">
            신고가 접수됐어요. 검토 후 조치됩니다.
          </p>
        ) : (
          <>
            <p className="mt-2 text-xs text-[var(--text-muted)]">사유를 골라주세요. 익명으로 처리됩니다.</p>
            <div className="mt-4 space-y-2">
              {REPORT_REASONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setReason(r.id)}
                  className={`flex w-full items-center gap-2 rounded-[14px] border p-3 text-left text-sm ${
                    reason === r.id
                      ? 'border-[var(--ink)] bg-[var(--ink)] text-white'
                      : 'border-[var(--border)] text-[var(--text)]'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <textarea
              value={detail}
              onChange={(event) => setDetail(event.target.value)}
              placeholder="추가 설명 (선택)"
              className="mt-3 min-h-20 w-full resize-none rounded-[14px] border border-[var(--border)] bg-[var(--bg)] p-3 text-sm outline-none"
            />
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-full border border-[var(--border-strong)] px-4 py-3 text-sm font-semibold text-[var(--text)]"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={busy}
                className="flex-1 rounded-full bg-red-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {busy ? '제출 중…' : '신고 제출'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
