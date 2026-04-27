import { useState } from 'react';

import { AuthProvider, useAuth } from './lib/auth-context';
import { DataProvider, useData } from './lib/data-context';
import { NotificationsProvider } from './lib/notifications-context';
import { ThemeProvider } from './lib/theme-context';
import { hasSupabaseConfig } from './lib/supabase';

import { Shell, Splash, ToastStack } from './components/ui';
import OnboardingModal from './components/OnboardingModal';
import AddToCollectionPicker from './components/AddToCollectionPicker';

import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import SearchScreen from './screens/SearchScreen';
import SpaceScreen from './screens/SpaceScreen';
import RecordScreen from './screens/RecordScreen';
import ArtworkDetail from './screens/ArtworkDetail';
import ArtworkEditScreen from './screens/ArtworkEditScreen';
import PersonExhibition from './screens/PersonExhibition';
import ProfileEditScreen from './screens/ProfileEditScreen';
import CurateScreen from './screens/CurateScreen';
import PlaceExhibition from './screens/PlaceExhibition';
import CalendarScreen from './screens/CalendarScreen';
import TwentyFiveScreen from './screens/TwentyFiveScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import KeywordScreen from './screens/KeywordScreen';
import CameraScreen from './screens/CameraScreen';
import BulkPrivacyScreen from './screens/BulkPrivacyScreen';
import SavedScreen from './screens/SavedScreen';
import ActivityScreen from './screens/ActivityScreen';
import CollectionsScreen from './screens/CollectionsScreen';
import CollectionDetailScreen from './screens/CollectionDetailScreen';
import MessagesScreen from './screens/MessagesScreen';
import ConversationScreen from './screens/ConversationScreen';

function MainApp() {
  const [screen, setScreen] = useState('home');
  const [selectedArtworkId, setSelectedArtworkId] = useState(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedKeyword, setSelectedKeyword] = useState(null);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [selectedCollectionId, setSelectedCollectionId] = useState(null);
  const [selectedConvOtherId, setSelectedConvOtherId] = useState(null);
  const [collectionPickerArtwork, setCollectionPickerArtwork] = useState(null);

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

  return (
    <>
      <Shell screen={screen} setScreen={setScreen}>{content}</Shell>
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
        <p className="text-[11px] font-semibold tracking-[0.16em] text-[var(--text-muted)]">시선집</p>
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
