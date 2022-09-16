import { Avatar, Group, Header as MantineHeader, Title } from '@mantine/core'
import { ColorSchemeToggle } from '@/components/ColorSchemeToggle'

export function Header() {
  return (
    <MantineHeader height={60}>
      <Group position="apart" align="center" py={8}>
        <div />
        <Group>
          <Avatar src="/icon-192.png" alt="logo" />
          <Title>sendy</Title>
        </Group>
        <ColorSchemeToggle />
      </Group>
    </MantineHeader>
  )
}