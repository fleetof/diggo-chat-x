'use client';

import { useRouter } from 'next/navigation';
import { memo, useEffect } from 'react';

import { topicService } from '@/services/topic';
// <-- 确保导入
import { useGlobalStore } from '@/store/global';
import { systemStatusSelectors } from '@/store/global/selectors';
import { useSessionStore } from '@/store/session';
// <-- 确保导入
import { useUserStore } from '@/store/user';

import { AppLoadingStage } from '../stage';

interface RedirectProps {
  setActiveStage: (value: AppLoadingStage) => void;
}

const Redirect = memo<RedirectProps>(({ setActiveStage }) => {
  const router = useRouter();
  const isUserStateInit = useUserStore((s) => s.isUserStateInit);
  const activeId = useSessionStore((s) => s.activeId); // <-- 使用 activeId
  const isPgliteNotEnabled = useGlobalStore(systemStatusSelectors.isPgliteNotEnabled);

  const navigateToChatWithLatestTopic = async () => {
    setActiveStage(AppLoadingStage.GoToChat);
    try {
      if (!activeId) {
        router.replace('/chat');
        return;
      }

      const topics = await topicService.getTopics({ sessionId: activeId }); // <-- 使用 topicService

      if (topics && topics.length > 0) {
        const latestTopicId = topics[0].id;
        router.replace(`/chat?topic=${latestTopicId}`);
      } else {
        router.replace('/chat');
      }
    } catch (error) {
      console.error('[ClientRedirect] Failed to fetch topics, redirecting to /chat:', error);
      router.replace('/chat');
    }
  };

  useEffect(() => {
    if (isPgliteNotEnabled) {
      setActiveStage(AppLoadingStage.GoToChat);
      router.replace('/chat');
      return;
    }

    if (!isUserStateInit) {
      setActiveStage(AppLoadingStage.InitUser);
      return;
    }

    navigateToChatWithLatestTopic();
  }, [isUserStateInit, isPgliteNotEnabled, activeId, router, setActiveStage]); // <-- 依赖项更新

  return null;
});

export default Redirect;
