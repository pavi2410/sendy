import { Title, Header as MantineHeader, Center } from '@mantine/core'

export function Header() {
  return (
    <MantineHeader height={60}>
      <Center>
        <Title>sendy</Title>
      </Center>
    </MantineHeader>
  )
}