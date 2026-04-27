import { useState } from 'react';
import {
  GoogleLogo,
} from '../components/ui';




import { signInWithEmail, signInWithGoogle, signInAnonymous } from '../lib/auth-context';







export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null); // 'email' | 'google' | 'anon' | null

  const handleEmail = async (event) => {
    event.preventDefault();
    if (!email) return;
    setBusy('email');
    setError(null);
    try {
      await signInWithEmail(email);
      setSent(true);
    } catch (err) {
      setError(err.message || '로그인 실패');
    } finally {
      setBusy(null);
    }
  };

  const handleGoogle = async () => {
    setBusy('google');
    setError(null);
    try {
      await signInWithGoogle();
      // OAuth 리디렉션이 일어나므로 여기까지 도달하지 않음
    } catch (err) {
      setError(err.message || 'Google 로그인 실패. Supabase에서 Google provider가 활성화 됐는지 확인해주세요.');
      setBusy(null);
    }
  };

  const handleAnon = async () => {
    setBusy('anon');
    setError(null);
    try {
      await signInAnonymous();
    } catch (err) {
      setError(err.message || '익명 로그인 실패. Supabase Auth → Providers → Anonymous Sign-Ins이 켜져있는지 확인해주세요.');
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--ink)] text-white">
      <div className="mx-auto flex min-h-screen max-w-[430px] flex-col justify-between p-5">
        <section className="relative min-h-[560px] flex-1 overflow-hidden rounded-[32px] bg-gradient-to-br from-[var(--hero-from)] via-[var(--hero-via)] to-[var(--hero-to)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,200,140,0.18),transparent_60%)]" />
          <div className="relative flex h-full min-h-[560px] flex-col justify-between p-6">
            <div className="flex items-center justify-between text-[12px] font-semibold tracking-[0.16em]">
              <span>카든냥</span>
              <span>카메라 든 냥이</span>
            </div>
            <div>
              <h1 className="text-[48px] font-extrabold leading-[0.92] tracking-[-0.1em]">
                냥이가<br />본 오늘
              </h1>
              <p className="mt-4 text-[15px] leading-7 text-white/80">하루 네 장.<br />그중 가장 오래 남은 25번째 한 장.</p>

              {sent ? (
                <div className="mt-8 rounded-[20px] bg-white/10 p-5 text-sm leading-6">
                  <p className="font-semibold">메일을 보냈어요.</p>
                  <p className="mt-2 text-white/70">
                    <span className="font-semibold text-white">{email}</span> 받은편지함의 매직 링크를 누르면 입장됩니다. (스팸함도 확인)
                  </p>
                  <button
                    type="button"
                    onClick={() => { setSent(false); setEmail(''); }}
                    className="mt-3 text-xs text-white/60 underline"
                  >
                    다른 이메일로 다시
                  </button>
                </div>
              ) : (
                <div className="mt-8 space-y-3">
                  {/* 체험하기 — 가장 빠른 입구로 부각 */}
                  <button
                    type="button"
                    onClick={handleAnon}
                    disabled={!!busy}
                    className="w-full rounded-full bg-white px-5 py-4 text-sm font-extrabold text-[var(--text)] tracking-[-0.04em] shadow-[0_8px_24px_rgba(255,255,255,0.18)] disabled:opacity-50"
                  >
                    {busy === 'anon' ? '입장 중…' : '체험하기 (1초 시작)'}
                  </button>

                  <button
                    type="button"
                    onClick={handleGoogle}
                    disabled={!!busy}
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-white/30 bg-white/5 px-5 py-4 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    <GoogleLogo />
                    {busy === 'google' ? 'Google로 이동…' : 'Google로 계속하기'}
                  </button>

                  {!showEmail ? (
                    <button
                      type="button"
                      onClick={() => setShowEmail(true)}
                      className="w-full text-center text-xs text-white/60 underline"
                    >
                      이메일 매직 링크로 로그인
                    </button>
                  ) : (
                    <form onSubmit={handleEmail} className="space-y-2 rounded-[20px] bg-white/5 p-3">
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="이메일"
                        className="w-full rounded-full border border-white/30 bg-transparent px-5 py-3 text-sm text-white placeholder:text-white/50 outline-none focus:border-white/60"
                      />
                      <button
                        type="submit"
                        disabled={!!busy}
                        className="w-full rounded-full bg-white/15 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        {busy === 'email' ? '메일 보내는 중…' : '매직 링크 받기'}
                      </button>
                    </form>
                  )}

                  {error && <p className="text-xs text-red-300">{error}</p>}
                  <p className="text-[10px] leading-4 text-white/50">
                    체험은 익명 계정으로 시작해요. 브라우저 데이터를 지우거나 다른 기기로 옮기면 계정이 사라집니다. 데모 봇 5명과 작품들이 함께 보입니다.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
