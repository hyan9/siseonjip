// 카든냥 소개 / 사용법 — 처음 들어오는 사람용 가이드
import { Header } from '../components/ui';
import { CatPhotographer, CatSleepyFour } from '../components/Mascot';
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
      <div className="space-y-5 pb-6">
        {/* 개요 */}
        <section className="rounded-[20px] bg-[var(--surface)] p-5 text-center shadow-[0_0_0_1px_var(--border)]">
          <div className="mx-auto mb-3 flex justify-center text-[var(--ink)]">
            <CatPhotographer size={88} animate />
          </div>
          <h2 className="text-[22px] font-extrabold leading-tight tracking-[-0.07em]">
            하루 네 장. 그중 한 장.
          </h2>
          <p className="mt-2 text-[12px] leading-6 text-[var(--text-body)]">
            카든냥은 매일 네 장의 사진만 올리는 사진 일기 앱입니다.<br />
            한 달 24장이 모이면, 그중 가장 오래 남은 한 장을<br />
            <strong>25번째 사진</strong>으로 정해 한 롤이 완성돼요.
          </p>
        </section>

        {/* 25번째 메타포 */}
        <section className="rounded-[20px] bg-[var(--surface)] p-5 shadow-[0_0_0_1px_var(--border)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
            왜 25번째?
          </p>
          <p className="mt-2 text-[14px] leading-7 text-[var(--text-body)]">
            영화 <em>월터의 상상은 현실이 된다</em>에서, 사진가 션 오코넬은 마지막 25번째 칸을 비워둡니다.
            가장 아름다운 한 장은 셔터를 누르지 않은 채 마음에만 남기는 거라며.
          </p>
          <p className="mt-3 text-[14px] leading-7 text-[var(--text-body)]">
            카든냥의 25번째는 그 메타포입니다. <strong>매달 가장 오래 남은 한 장</strong>을 직접 골라서
            한 롤을 완성하세요. 프로필 아바타 자리도 그 한 장이 차지합니다.
          </p>
        </section>

        {/* 핵심 기능 */}
        <section className="space-y-3">
          <h2 className="text-[18px] font-extrabold tracking-[-0.06em]">기능</h2>
          <div className="space-y-2">
            <FeatureRow
              icon={<IconCalendar size={18} />}
              title="필름 — 롤·일주일·월별"
              body="이번 달 24+1칸 진행률, 일주일 필름 스트립, 월별 캘린더. 사진 누르면 그날 4컷이 위아래 스크롤로 펼쳐져요."
            />
            <FeatureRow
              icon={<IconStar size={18} />}
              title="25번째 사진"
              body="24장 다 채우면 '25번째 고르기' 버튼이 떠요. 결정 순간 마스코트가 축하하러 등장합니다."
            />
            <FeatureRow
              icon={<IconHype size={18} filled />}
              title="Hype"
              body="다른 사람 사진에 hype를 누르면 작가에게 알림이 가요. 5+ 받으면 시선집 list에 ★."
            />
            <FeatureRow
              icon={<IconBookmark size={18} />}
              title="저장 / 컬렉션"
              body="좋은 사진은 저장하거나 주제별 컬렉션으로 묶으세요. TopBar 메뉴 → 저장한 사진 / 컬렉션."
            />
          </div>
        </section>

        {/* 페르소나 5명 */}
        <section className="space-y-3">
          <h2 className="text-[18px] font-extrabold tracking-[-0.06em]">데모 봇</h2>
          <p className="text-[12px] leading-6 text-[var(--text-muted)]">
            처음에는 다섯 마리 데모 봇과 함께 둘러봅니다. 진짜 친구를 초대하면 함께 셔터를 누를 수 있어요.
          </p>
          <ul className="space-y-1 text-[13px] leading-7">
            <li><strong>이끼</strong> — 비 오기 직전의 색</li>
            <li><strong>소금</strong> — 오후 세 시의 식탁</li>
            <li><strong>리넨</strong> — 느린 산책</li>
            <li><strong>느와르</strong> — 검은 빛</li>
            <li><strong>주전자</strong> — 하루의 윗면</li>
          </ul>
        </section>

        {/* 사용 흐름 */}
        <section className="space-y-3">
          <h2 className="text-[18px] font-extrabold tracking-[-0.06em]">시작하기</h2>
          <ol className="space-y-2 text-[13px] leading-7">
            <li><strong>1.</strong> 하단 + 버튼으로 사진 4장까지 올리기 (제목 필수)</li>
            <li><strong>2.</strong> 일주일이 지나면 [필름] 탭에서 한 롤이 채워지는 걸 확인</li>
            <li><strong>3.</strong> 한 달 24장 모이면 25번째 한 장을 결정</li>
            <li><strong>4.</strong> 친구 초대(우상단 ☰ 메뉴) → 같이 셔터를 눌러요</li>
          </ol>
        </section>

        {/* 카피 — 잠든 사진가 고양이 */}
        <section className="rounded-[20px] bg-[var(--surface)] p-5 shadow-[0_0_0_1px_var(--border)]">
          <div className="flex justify-center text-[var(--ink)]">
            <CatSleepyFour size={180} />
          </div>
          <p className="mt-3 text-center text-[12px] leading-6 text-[var(--text-muted)]">
            네 장 다 쓰고 잠드는 게 카든냥의 하루.<br />
            오늘은 어떤 네 장이 남을까요?
          </p>
        </section>

        <button
          type="button"
          onClick={() => setScreen('record')}
          className="w-full rounded-full bg-[var(--ink)] px-5 py-4 text-sm font-extrabold tracking-[-0.04em] text-white"
        >
          첫 셔터 누르러 가기
        </button>
      </div>
    </>
  );
}

function FeatureRow({ icon, title, body }) {
  return (
    <div className="flex gap-3 rounded-[16px] bg-[var(--surface)] p-3 shadow-[0_0_0_1px_var(--border)]">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--ink)]">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-bold tracking-[-0.04em]">{title}</p>
        <p className="mt-0.5 text-[11px] leading-5 text-[var(--text-muted)]">{body}</p>
      </div>
    </div>
  );
}
