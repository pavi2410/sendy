import { Group, Header as MantineHeader, Title } from '@mantine/core'
import { ColorSchemeToggle } from '@/components/ColorSchemeToggle'

export function Header() {
  return (
    <MantineHeader height={60}>
      <Group position="apart" align="center" py={8}>
        <div />
        <Title>sendy</Title>
        <ColorSchemeToggle />
      </Group>
    </MantineHeader>
  )
}