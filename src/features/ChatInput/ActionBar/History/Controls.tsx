import { Form, type FormItemProps, SliderWithInput } from '@lobehub/ui';
import { Form as AntdForm } from 'antd';
import { debounce } from 'lodash-es';
import { memo, useEffect } from 'react';

import { useAgentStore } from '@/store/agent';
import { agentChatConfigSelectors } from '@/store/agent/selectors';

interface ControlsProps {
  setUpdating: (updating: boolean) => void;
  updating: boolean;
}
const Controls = memo<ControlsProps>(({ setUpdating }) => {
  const [form] = AntdForm.useForm();

  const [historyCount, updateAgentConfig] = useAgentStore((s) => {
    return [agentChatConfigSelectors.historyCount(s), s.updateAgentChatConfig];
  });

  // Sync external store updates to the form without remounting to keep Switch animation
  useEffect(() => {
    form?.setFieldsValue({
      historyCount,
    });
  }, [historyCount, form]);

  let items: FormItemProps[] = [
    {
      children: (
        <SliderWithInput
          max={5}
          min={0}
          size={'small'}
          step={1}
          style={{ marginBlock: 8, paddingLeft: 4 }}
          styles={{
            input: {
              maxWidth: 64,
            },
          }}
          unlimitedInput={false}
        />
      ),
      name: 'historyCount',
      noStyle: true,
    },
  ];

  return (
    <Form
      form={form}
      initialValues={{
        historyCount,
      }}
      items={items}
      itemsType={'flat'}
      onValuesChange={debounce(async (values) => {
        setUpdating(true);
        await updateAgentConfig(values);
        setUpdating(false);
      }, 500)}
      styles={{
        group: {
          background: 'transparent',
        },
      }}
    />
  );
});

export default Controls;
