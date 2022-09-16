import { Group, Button, Footer as MantineFooter, Text, Anchor } from '@mantine/core'

export function Footer() {
  return (
    <MantineFooter height={60}>
      <Group position="apart" sx={{ height: '100%' }} px={20}>
        <Text>Built by <Anchor href="https://pavi2410.me" target="_blank">pavi2410</Anchor></Text>
        <Button variant="subtle" component={Anchor} href="https://github.com/pavi2410/sendy" target="_blank">Sauce</Button>
      </Group>
    </MantineFooter>
  )
}