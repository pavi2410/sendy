//@ts-check
import { useState } from 'react'
import { fbApp } from './db'
import { Container, Title, Header, Group, Button, Footer, Text, Anchor, Center, Box, Modal, TextInput, Loader, Stack } from '@mantine/core'
import { Dropzone } from '@mantine/dropzone'
import { useClipboard, useId } from '@mantine/hooks';
import { getStorage, ref } from 'firebase/storage';
import { useUploadFile } from 'react-firebase-hooks/storage'
import QRCode from 'react-qr-code';

const storage = getStorage(fbApp);
const storageRef = ref(storage)

export default function Upload() {
  const id = useId(null, randomHex)
  const [opened, setOpened] = useState(false)

  return (
    <Container>
      <Header height={60}>
        <Group position="apart" sx={{ height: '100%' }} px={20}>
          <Title>sendy</Title>
        </Group>
      </Header>
      <Send id={id} setOpened={setOpened} />
      <Modal
        withCloseButton={false}
        centered
        opened={opened}
        onClose={() => setOpened(false)}>
        <Receive id={id} />
      </Modal>
      <Footer height={60}>
        <Group position="apart" sx={{ height: '100%' }} px={20}>
          <Text>Built by <Anchor href="https://pavi2410.me" target="_blank">
            pavi2410
          </Anchor></Text>
          <Button variant="subtle" component={Anchor} href="https://github.com/pavi2410/sendy" target="_blank">Sauce</Button>
        </Group>
      </Footer>
    </Container>
  )
}

function Send({ id, setOpened }) {
  const [uploadFile, uploading, snapshot, error] = useUploadFile();

  async function onDrop(files) {
    const file = files[0];
    const result = await uploadFile(ref(storageRef, id), file, { customMetadata: { realFileName: file.name } });
    setOpened(true)
  }

  return (
    <Center sx={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <Dropzone onDrop={onDrop} loading={uploading}>
        {
          (status) => (
            <Box sx={{ padding: '4rem 2rem' }}>
              <Text size="xl" inline>
                Drop a file here or click to select file
              </Text>
              <Text size="sm" color="dimmed" inline mt={8}>
                File size should not exceed 50MB
              </Text>
            </Box>
          )
        }
      </Dropzone>
    </Center>
  )
}

function Receive({ id }) {
  const url = window.location.origin + '/' + id
  const { copied, copy } = useClipboard({ timeout: 1000 })

  const copyButton = <Button onClick={() => copy(url)} color={copied ? 'green' : ''}>{copied ? 'Copied' : 'Copy'}</Button>;
  return (
    <Stack spacing="md" p="xl">
      <Title>File uploaded</Title>
      <TextInput label="Download Link" value={url} readOnly rightSection={copyButton} />
      <Center>
        <QRCode value={url} />
      </Center>
    </Stack>
  )
}

function randomHex() {
  return Math.random().toString(16).substring(2, 10)
}