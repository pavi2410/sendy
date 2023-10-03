import { Avatar, Group, Title } from '@mantine/core'

export function Header() {
  return (
    <Group justify="center" align="center" h="100%">
      <Avatar src="/icon-192.png" alt="logo" />
      <Title order={2}>sendy</Title>
    </Group>
  )
}