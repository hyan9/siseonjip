import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';

import { AuthProvider, useAuth } from './lib/auth-context';
import { DataProvider, useData } from './lib/data-context';
import { NotificationsProvider } from './lib/notifications-context';
import { ThemeProvider } from './lib/theme-context';
import { hasSupabaseConfig } from './lib/supabase';

import { Shell, Splash, ToastStack } from './components/ui';
import OnboardingModal from './components/OnboardingModal';
import AddToCollectionPicker from './components/AddToCollectionPicker';

// 즉시 로딩: 첫 진입에서 반드시 보임
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';

// 지연 로딩: 사용자가 탭/메뉴를 누른 시점에 fetch
const SearchScreen = lazy(() => import('./screens/SearchScreen'));
const SpaceScreen = lazy(() => import('./screens/SpaceScreen'));
const RecordScreen = lazy(() => import('./screens/RecordScreen'));
const ArtworkDetail = lazy(() => import('./screens/ArtworkDetail'));
const ArtworkEditScreen = lazy(() => import('./screens/ArtworkEditScreen'));
const PersonExhibition = lazy(() => import('./screens/PersonExhibition'));
const ProfileEditScreen = lazy(() => import('./screens/ProfileEditScreen'));
const CurateScreen = lazy(() => import('./screens/CurateScreen'));
const PlaceExhibition = lazy(() => import('./screens/PlaceExhibition'));
const CalendarScreen = lazy(() => import('./screens/CalendarScreen'));
const TwentyFiveScreen = lazy(() => import('./screens/TwentyFiveScreen'));
const NotificationsScreen = lazy(() => import('./screens/NotificationsScreen'));
const KeywordScreen = lazy(() => import('./screens/KeywordScreen'));
const CameraScreen = lazy(() => import('./screens/CameraScreen'));
const BulkPrivacyScreen = lazy(() => import('./screens/BulkPrivacyScreen'));
const SavedScreen = lazy(() => import('./screens/SavedScreen'));
const ActivityScreen = lazy(() => import('./screens/ActivityScreen'));
const CollectionsScreen = lazy(() => import('./screens/CollectionsScreen'));
const CollectionDetailScreen = lazy(() => import('./screens/CollectionDetailScreen'));
const MessagesScreen = lazy(() => import('./screens/MessagesScreen'));
const ConversationScreen = lazy(() => import('./screens/ConversationScreen'));
const GuideScreen = lazy(() => import('./screens/GuideScreen'));

function MainApp() {
  const [screenStack, setScreenStack] = useState(['home']);
  const screen = screenStack[screenStack.length - 1];
  const [selectedArtworkId, setSelectedArtworkId] = useState(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedKeyword, setSelectedKeyword] = useState(null);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [selectedCollectionId, setSelectedCollectionId] = useState(null);
  const [selectedConvOtherId, setSelectedConvOtherId] = useState(null);
  const [collectionPickerArtwork, setCollectionPickerArtwork] = useState(null);

  // 모바일 back 버튼: history.pushState로 화면별 entry 만들고, popstate에서 stack pop.
  // 하단 nav 5개(home/space/record/archive/profile)는 root 레벨로 취급 → 새 root 누르면 스택 리셋.
  const ROOT_SCREENS = useRef(new Set(['home', 'space', 'record', 'archive', 'profile']));
  const isInternalNav = useRef(false);

  const setScreen = useCallback((next) => {
    setScreenStack((prev) => {
      const cur = prev[prev.length - 1];
      if (next === cur) return prev;
      // root 화면이면 stack 리셋, 그 외엔 push
      const newStack = ROOT_SCREENS.current.has(next) ? [next] : [...prev, next];
      // history entry 추가 (popstate에서 안 잡히도록 isInternalNav 플래그)
      try {
        isInternalNav.current = true;
        window.history.pushState({ kadennyang: newStack.length }, '', '');
      } catch {
        // pushState 실패 무시
      }
      return newStack;
    });
  }, []);

  // 첫 진입 시 history 초기화 (root entry 1개)
  useEffect(() => {
    try {
      window.history.replaceState({ kadennyang: 1 }, '', '');
    } catch {
      // 환경에 따라 실패 무시
    }
  }, []);

  // 뒤로가기 처리 — stack pop. stack 길이 1이면 그대로 (앱 종료 방지: 다시 push)
  useEffect(() => {
    const onPop = () => {
      setScreenStack((prev) => {
        if (prev.length <= 1) {
          // 홈 상태에서 back — 히스토리 entry 다시 추가해 앱 안 나가게
          try { window.history.pushState({ kadennyang: 1 }, '', ''); } catch {
            // 환경에 따라 실패 무시
          }
          return prev;
        }
        return prev.slice(0, -1);
      });
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const openArtwork = (id) => { setSelectedArtworkId(id); setScreen('detail'); };
  const openPlace = (id) => { setSelectedPlaceId(id); setScreen('place'); };
  const openPerson = (id) => { setSelectedUserId(id); setScreen('person'); };
  const openKeyword = (word) => { setSelectedKeyword(word); setScreen('keyword'); };
  const openCamera = (camera) => { setSelectedCamera(camera); setScreen('camera'); };
  const openCollection = (id) => { setSelectedCollectionId(id); setScreen('collectionDetail'); };
  const openConversation = (otherId) => { setSelectedConvOtherId(otherId); setScreen('conversation'); };
  const openCollectionPicker = (artworkId) => { setCollectionPickerArtwork(artworkId); };

  let content = null;
  if (screen === 'home') content = <HomeScreen setScreen={setScreen} openArtwork={openArtwork} openPlace={openPlace} openPerson={openPerson} openKeyword={openKeyword} />;
  if (screen === 'search') content = <SearchScreen openArtwork={openArtwork} openPerson={openPerson} openPlace={openPlace} />;
  if (screen === 'space') content = <SpaceScreen openPlace={openPlace} openArtwork={openArtwork} />;
  if (screen === 'record') content = <RecordScreen setScreen={setScreen} openArtwork={openArtwork} />;
  if (screen === 'detail') content = <ArtworkDetail artworkId={selectedArtworkId} setScreen={setScreen} openArtwork={openArtwork} openPlace={openPlace} openPerson={openPerson} openKeyword={openKeyword} openCamera={openCamera} openCollectionPicker={openCollectionPicker} />;
  if (screen === 'artworkEdit') content = <ArtworkEditScreen artworkId={selectedArtworkId} setScreen={setScreen} />;
  if (screen === 'person') content = <PersonExhibition userId={selectedUserId} setScreen={setScreen} openArtwork={openArtwork} openConversation={openConversation} openPerson={openPerson} />;
  if (screen === 'profile') content = <PersonExhibitionMe setScreen={setScreen} openArtwork={openArtwork} openConversation={openConversation} openPerson={openPerson} />;
  if (screen === 'profileEdit') content = <ProfileEditScreen setScreen={setScreen} />;
  if (screen === 'curate') content = <CurateScreen setScreen={setScreen} openArtwork={openArtwork} />;
  if (screen === 'place') content = <PlaceExhibition placeId={selectedPlaceId} setScreen={setScreen} openArtwork={openArtwork} />;
  if (screen === 'archive') content = <CalendarScreen openArtwork={openArtwork} setScreen={setScreen} />;
  if (screen === 'twentyFive') content = <TwentyFiveScreen setScreen={setScreen} />;
  if (screen === 'notifications') content = <NotificationsScreen setScreen={setScreen} openArtwork={openArtwork} openPerson={openPerson} />;
  if (screen === 'keyword') content = <KeywordScreen keyword={selectedKeyword} setScreen={setScreen} openArtwork={openArtwork} />;
  if (screen === 'camera') content = <CameraScreen camera={selectedCamera || {}} setScreen={setScreen} openArtwork={openArtwork} />;
  if (screen === 'bulkPrivacy') content = <BulkPrivacyScreen setScreen={setScreen} />;
  if (screen === 'saved') content = <SavedScreen setScreen={setScreen} openArtwork={openArtwork} />;
  if (screen === 'activity') content = <ActivityScreen setScreen={setScreen} openArtwork={openArtwork} openPerson={openPerson} />;
  if (screen === 'collections') content = <CollectionsScreen setScreen={setScreen} openCollection={openCollection} />;
  if (screen === 'collectionDetail') content = <CollectionDetailScreen collectionId={selectedCollectionId} setScreen={setScreen} openArtwork={openArtwork} />;
  if (screen === 'messages') content = <MessagesScreen setScreen={setScreen} openConversation={openConversation} openPerson={openPerson} />;
  if (screen === 'conversation') content = <ConversationScreen otherId={selectedConvOtherId} setScreen={setScreen} openPerson={openPerson} />;
  if (screen === 'guide') content = <GuideScreen setScreen={setScreen} />;

  return (
    <>
      <Shell screen={screen} setScreen={setScreen}>
        <Suspense fallback={<Splash />}>{content}</Suspense>
      </Shell>
      <OnboardingModal />
      {collectionPickerArtwork && (
        <AddToCollectionPicker
          artworkId={collectionPickerArtwork}
          onClose={() => setCollectionPickerArtwork(null)}
        />
      )}
    </>
  );
}

function PersonExhibitionMe({ setScreen, openArtwork, openConversation, openPerson }) {
  const { userId } = useData();
  if (!userId) return <Splash />;
  return <PersonExhibition userId={userId} setScreen={setScreen} openArtwork={openArtwork} openConversation={openConversation} openPerson={openPerson} />;
}

function DataGate({ children }) {
  const { loading, error } = useData();
  if (loading) return <Splash />;
  if (error) {
    return (
      <Splash message={`데이터 로드 실패: ${error.message}. .env.local 또는 Supabase 설정을 확인해주세요.`} />
    );
  }
  return children;
}

function SetupNeededScreen() {
  return (
    <div className="min-h-screen bg-[var(--bg)] p-6">
      <div className="mx-auto max-w-[430px] space-y-4 rounded-[24px] bg-[var(--surface)] p-6 shadow-[0_0_0_1px_var(--border)]">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-[var(--text-muted)]">카든냥</p>
        <h1 className="text-[26px] font-extrabold leading-tight tracking-[-0.07em]">
          먼저 Supabase를<br />연결해야 해요
        </h1>
        <p className="text-sm leading-6 text-[var(--text-body)]">
          백엔드(데이터베이스/사진 저장/로그인)가 비어있어 앱이 작동하지 않습니다.
          <br />프로젝트 루트의 <code className="rounded bg-[var(--surface-2)] px-1">SETUP.md</code> 가이드를 따라
          <code className="ml-1 rounded bg-[var(--surface-2)] px-1">.env.local</code> 두 줄을 채운 뒤 개발 서버를 다시 시작하세요.
        </p>
        <div className="rounded-[16px] bg-[var(--ink)] p-4 text-xs leading-6 text-white/90">
          <p>VITE_SUPABASE_URL=...</p>
          <p>VITE_SUPABASE_ANON_KEY=...</p>
        </div>
        <p className="text-xs leading-5 text-[var(--text-muted)]">
          값은 Supabase 대시보드 → Project Settings → API 에서 복사할 수 있어요.
        </p>
      </div>
    </div>
  );
}

function Router() {
  const { session, loading: authLoading } = useAuth();

  if (!hasSupabaseConfig) return <SetupNeededScreen />;
  if (authLoading) return <Splash />;
  if (!session) return <LoginScreen />;

  return (
    <DataProvider>
      <DataGate>
        <NotificationsProvider>
          <MainApp />
          <ToastStack />
        </NotificationsProvider>
      </DataGate>
    </DataProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router />
      </AuthProvider>
    </ThemeProvider>
  );
}
