import { TopicDisplayMode } from '@/types/topic';
import { UserPreference } from '@/types/user';

export const DEFAULT_PREFERENCE: UserPreference = {
  guide: {
    moveSettingsToAvatar: true,
    topic: true,
  },
  telemetry: false,
  topicDisplayMode: TopicDisplayMode.ByTime,
  useCmdEnterToSend: false,
};
