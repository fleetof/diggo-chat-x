import { Timer, TimerOff } from 'lucide-react';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useIsMobile } from '@/hooks/useIsMobile';
import { useAgentStore } from '@/store/agent';
import { agentChatConfigSelectors, agentSelectors } from '@/store/agent/selectors';

import Action from '../components/Action';
import Controls from './Controls';

const History = memo(() => {
  const [isLoading] = useAgentStore((s) => [agentSelectors.isAgentConfigLoading(s)]);
  const [updating, setUpdating] = useState(false);
  const { t } = useTranslation('setting');
  const isMobile = useIsMobile();

  const historyCount = useAgentStore(agentChatConfigSelectors.historyCount);

  if (isLoading) return <Action disabled icon={TimerOff} />;

  const title = t('settingChat.enableHistoryCount.limited', { number: historyCount || 0 });

  return (
    <Action
      icon={Timer}
      loading={updating}
      onClick={undefined}
      popover={{
        content: <Controls setUpdating={setUpdating} updating={updating} />,
        minWidth: 240,
        trigger: isMobile ? ['click'] : ['hover'],
      }}
      showTooltip={false}
      title={title}
    />
  );
});

export default History;
