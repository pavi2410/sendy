import { Group, Button, Text, Anchor } from '@mantine/core'

export function Footer() {
  return (
    <Group justify="space-between" p="md">
      <Text>Built by <Anchor href="https://pavi2410.me" target="_blank">pavi2410</Anchor></Text>
      <Button variant="subtle" component={Anchor} href="https://github.com/pavi2410/sendy" target="_blank" underline="never">Sauce</Button>
    </Group>
  )
}