import { Switch, Group, useMantineColorScheme } from '@mantine/core';
import { IconSun, IconMoonStars } from '@tabler/icons';
import { useMemo } from 'react';

export function ColorSchemeToggle() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const checked = useMemo(() => colorScheme === 'dark', [colorScheme]);

  return (
    <Group position="center" pr="lg">
      <Switch
        size="lg"
        checked={checked}
        onChange={() => toggleColorScheme()}
        thumbIcon={
          checked
            ? <IconMoonStars size={18} stroke={1.5} color='black' />
            : <IconSun size={18} stroke={1.5} />
        }
      />
    </Group>
  );
}