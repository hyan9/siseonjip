// 카든냥 소개 / 사용법 — 처음 들어오는 사람용 가이드
import { Header } from '../components/ui';
import { CatSleepyFour, CatStarlit, PersonaCat, PersonaCatSvg, PERSONA_VARIANTS, PERSONA_KEYS } from '../components/Mascot';
import { IconHype, IconStar, IconBookmark, IconCalendar } from '../components/icons/AppIcons';

export default function GuideScreen({ setScreen }) {
  return (
    <>
      <Header
        title="카든냥이란?"
        subtitle="카메라 든 냥이의 하루 네 장"
        kicker="가이드"
        onBack={() => setScreen('home')}
      />
      <div className="space-y-6 pb-8">
        {/* HERO — 별빛 카든냥 + 슬로건 */}
        <section className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#1f2436] via-[#191b2a] to-[#0d0e16] px-6 py-8 text-center text-white shadow-[0_12px_36px_rgba(0,0,0,0.22)]">
          <div className="flex justify-center">
            <CatStarlit size={180} />
          </div>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white/70">
            카든냥 — 카메라 든 냥이
          </p>
          <h2 className="mt-3 text-[26px] font-extrabold leading-[1.1] tracking-[-0.07em]">
            하루 네 장.<br />그중 한 장.
          </h2>
          <p className="mt-4 text-[13px] leading-[1.8] text-white/85">
            매일 네 장의 사진만 올리는 작은 사진 일기.<br />
            한 달 24장이 모이면, 가장 오래 남은 한 장을<br />
            <strong className="text-white">25번째 사진</strong>으로 골라 한 롤이 완성돼요.
          </p>
        </section>

        {/* 25번째 메타포 */}
        <section className="rounded-[20px] bg-[var(--surface)] p-5 shadow-[0_0_0_1px_var(--border)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
            왜 25번째인가
          </p>
          <h3 className="mt-2 text-[18px] font-extrabold tracking-[-0.05em]">
            가장 아름다운 한 장은 마음에 남는다
          </h3>
          <div className="mt-3 space-y-3 text-[13px] leading-[1.85] text-[var(--text-body)]">
            <p>
              영화 <em>월터의 상상은 현실이 된다</em>에서, 사진가 션 오코넬은 마지막
              25번째 칸을 비워둡니다.
            </p>
            <p className="rounded-[12px] border-l-2 border-[var(--accent)] bg-[var(--surface-2)] px-4 py-3 text-[var(--text-quote)]">
              "정말 아름다운 순간은 카메라 뒤에 머무르지 않는 거야."
            </p>
            <p>
              카든냥의 25번째는 그 메타포예요.<br />
              매달 직접 한 장을 골라 한 롤을 완성하세요.<br />
              그 한 장이 곧 당신의 프로필이 됩니다.
            </p>
          </div>
        </section>

        {/* 핵심 기능 4개 */}
        <section>
          <h2 className="mb-3 px-1 text-[16px] font-extrabold tracking-[-0.05em]">기능</h2>
          <div className="space-y-2">
            <FeatureRow
              icon={<IconCalendar size={18} />}
              title="필름 — 롤·일주일·월별"
              body="이번 달 24+1칸 진행률, 일주일 필름 스트립, 월별 캘린더. 사진 누르면 그날 네 장이 위아래 스크롤로 펼쳐져요."
            />
            <FeatureRow
              icon={<IconStar size={18} />}
              title="25번째 사진"
              body="24장 다 채우면 ‘25번째 고르기’가 떠요. 결정 순간 마스코트가 축하하러 등장합니다."
            />
            <FeatureRow
              icon={<IconHype size={18} filled />}
              title="Hype — 화염"
              body="다른 사람 사진에 화염을 보내면 작가에게 알림이 가요. 5+ 받으면 시선집 list에 ★."
            />
            <FeatureRow
              icon={<IconBookmark size={18} />}
              title="저장 / 컬렉션"
              body="좋은 사진은 저장하거나 주제별 컬렉션으로 묶으세요. 우상단 ☰ 메뉴에서 진입."
            />
          </div>
        </section>

        {/* 10가지 카든냥 자아 — 페르소나 그리드 */}
        <section className="rounded-[20px] bg-[var(--surface)] p-5 shadow-[0_0_0_1px_var(--border)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">10가지 자아</p>
          <h3 className="mt-1 text-[18px] font-extrabold tracking-[-0.05em]">오늘은 어떤 냥이의 시선?</h3>
          <p className="mt-2 text-[12px] leading-[1.7] text-[var(--text-muted)]">
            카든냥은 한 마리가 아니에요. 도화지·야간·식빵·치즈·고등어·점박이·보라·엽록소·사이버펑크·외계 — 열 가지 자아 중 하나를 골라 셔터를 누르는 작은 의례.
          </p>
          <div className="mt-4 grid grid-cols-5 gap-2">
            {PERSONA_KEYS.map((key) => (
              <div key={key} className="flex flex-col items-center gap-1">
                <PersonaCat persona={key} size={56} />
                <span className="text-[10px] font-bold tracking-[-0.04em] text-[var(--text-body)]">
                  {PERSONA_VARIANTS[key].label}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] leading-[1.7] text-[var(--text-faint)]">
            메뉴 → 오늘의 냥이에서 자유롭게 전환. 색·질감·마스코트가 모두 함께 바뀝니다.
          </p>
        </section>

        {/* 고양이 봇 5명 — 내가 그린 SVG (어딘가 기괴한 맛) */}
        <section className="rounded-[20px] bg-[var(--surface)] p-5 shadow-[0_0_0_1px_var(--border)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">고양이 봇</p>
          <h3 className="mt-1 text-[18px] font-extrabold tracking-[-0.05em]">먼저 와있는 다섯 마리</h3>
          <p className="mt-2 text-[12px] leading-[1.7] text-[var(--text-muted)]">
            처음 들어와도 외롭지 않게,<br />
            카든냥 봇 다섯 마리가 이미 셔터를 누르고 있어요.<br />
            사진을 올리면 800ms 안에 짧은 댓글 한 줄을 남깁니다.
          </p>
          <div className="mt-4 grid grid-cols-5 gap-2">
            {[
              { name: '이끼',   note: '비 오기 직전',     persona: 'chlorophyll' },
              { name: '소금',   note: '오후 세 시',       persona: 'paper' },
              { name: '리넨',   note: '느린 산책',         persona: 'bread' },
              { name: '느와르', note: '검은 빛',           persona: 'night' },
              { name: '주전자', note: '하루의 윗면',       persona: 'mackerel' },
            ].map(({ name, note, persona }) => (
              <div key={name} className="flex flex-col items-center gap-1">
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-[var(--surface-2)] text-[var(--ink)]"
                >
                  <PersonaCatSvg persona={persona} size={42} withFrame={false} />
                </span>
                <span className="text-[11px] font-bold tracking-[-0.04em]">{name}</span>
                <span className="text-[9px] leading-[1.4] text-[var(--text-faint)]">{note}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 시작 흐름 4단계 */}
        <section>
          <h2 className="mb-3 px-1 text-[16px] font-extrabold tracking-[-0.05em]">시작하기</h2>
          <ol className="space-y-2.5">
            {[
              ['하단 + 버튼', '오늘의 네 장을 올려요. 제목은 짧게 한 단어라도.'],
              ['일주일 뒤', '[필름] 탭에서 한 롤이 채워지는 걸 확인.'],
              ['한 달 뒤', '24장 모이면 25번째 한 장을 직접 결정.'],
              ['친구 초대', '☰ 메뉴 → 친구 초대로 같이 셔터를 눌러요.'],
            ].map(([t, b], i) => (
              <li key={t} className="flex gap-3 rounded-[14px] bg-[var(--surface)] p-3 shadow-[0_0_0_1px_var(--border)]">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] text-[12px] font-bold text-white">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold tracking-[-0.04em]">{t}</p>
                  <p className="mt-0.5 text-[11px] leading-[1.6] text-[var(--text-muted)]">{b}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Outro — 잠든 사진가 고양이 */}
        <section className="rounded-[20px] bg-[var(--surface)] p-5 shadow-[0_0_0_1px_var(--border)]">
          <div className="flex justify-center text-[var(--ink)]">
            <CatSleepyFour size={180} />
          </div>
          <p className="mt-3 text-center text-[12px] leading-[1.8] text-[var(--text-muted)]">
            네 장 다 쓰고 잠드는 게<br />
            카든냥의 하루.<br />
            <span className="mt-1 inline-block text-[var(--text-body)]">
              오늘은 어떤 네 장이 남을까요?
            </span>
          </p>
        </section>

        <button
          type="button"
          onClick={() => setScreen('record')}
          className="w-full rounded-full bg-[var(--ink)] px-5 py-4 text-sm font-extrabold tracking-[-0.04em] text-white"
        >
          첫 셔터 누르러 가기 →
        </button>
      </div>
    </>
  );
}

function FeatureRow({ icon, title, body }) {
  return (
    <div className="flex gap-3 rounded-[16px] bg-[var(--surface)] p-3.5 shadow-[0_0_0_1px_var(--border)]">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--ink)]">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-bold tracking-[-0.04em]">{title}</p>
        <p className="mt-1 text-[12px] leading-[1.7] text-[var(--text-muted)]">{body}</p>
      </div>
    </div>
  );
}
