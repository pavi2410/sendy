import { Group, ActionIcon, Anchor, AppShell, Center, Stack, Text, TextInput, Title, ThemeIcon, Container } from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import { useClipboard } from '@mantine/hooks';
import { getStorage, ref } from 'firebase/storage';
import React, { useEffect, useMemo, useState } from 'react';
import { useUploadFile } from 'react-firebase-hooks/storage';
import QRCode from 'react-qr-code';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { fbApp } from '@/db';
import { IconUpload, IconCheck, IconCopy } from '@tabler/icons-react';
import { generate } from 'random-words';

const storage = getStorage(fbApp);
const storageRef = ref(storage)

export default function Upload() {
  const id = useMemo(() => generate({ exactly: 3, join: '-' }), [])
  useEffect(() => console.log(id), [id])

  const [uploaded, setUploaded] = useState(false)

  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header>
        <Header />
      </AppShell.Header>

      <AppShell.Footer>
        <Footer />
      </AppShell.Footer>

      <AppShell.Main>
        <Container size='xs'>
          {
            uploaded
              ? <Receive id={id} />
              : <Send id={id} setUploaded={setUploaded} />
          }
        </Container>
      </AppShell.Main>
    </AppShell>
  )
}

function Send({ id, setUploaded }) {
  const [uploadFile, uploading, snapshot, error] = useUploadFile();

  async function onDrop(files) {
    const file = files[0];
    const result = await uploadFile(
      ref(storageRef, id),
      file,
      {
        contentDisposition: `attachment; filename="${file.name}"`,
        customMetadata: {
          realFileName: file.name
        }
      }
    );
    setUploaded(true)
  }

  return (
    <Dropzone
      maxFiles={1}
      maxSize={50 * 1024 * 1024}
      padding="xl"
      onDrop={onDrop}
      loading={uploading}
    >
      <Stack align="center" justify="center" spacing="lg" mih={220} style={{ pointerEvents: 'none' }}>
        {import.meta.env.DEV && <Text>{id}</Text>}
        <IconUpload size={48} />
        <Text size="xl" inline>
          Drop a file here or click to select file
        </Text>
        <Text size="sm" color="dimmed" inline mt={7}>
          File size should not exceed 50MB
        </Text>
      </Stack>
    </Dropzone>
  )
}

function Receive({ id }) {
  const url = window.location.origin + '/' + id
  const { copied, copy } = useClipboard({ timeout: 1000 })

  const copyButton = (
    <ActionIcon
      onClick={() => copy(url)}
      color={copied ? 'green' : ''}
    >
      <IconCopy size="70%" />
    </ActionIcon>
  );

  return (
    <Stack spacing="md" p="xl">
      <Group align='center'>
        <ThemeIcon radius="xl" size="lg" color="green">
          <IconCheck size="70%" />
        </ThemeIcon>
        <Title>
          File uploaded
        </Title>
      </Group>

      <TextInput label="Download Link" value={url} readOnly rightSection={copyButton} />

      <Center>
        <div style={{ background: 'white', padding: '16px' }}>
          <QRCode value={url} />
        </div>
      </Center>

      <Center>
        <Text c="dimmed">
          <Anchor onClick={() => window.location.reload()}>
            Refresh
          </Anchor>
          &nbsp;
          <Text span>
            this page to upload a new file.
          </Text>
        </Text>
      </Center>
    </Stack>
  )
}
