import { Anchor, AppShell, Button, Center, Modal, Stack, Text, TextInput, Title, ThemeIcon } from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import { useClipboard } from '@mantine/hooks';
import { getStorage, ref } from 'firebase/storage';
import React, { useEffect, useMemo, useState } from 'react';
import { useUploadFile } from 'react-firebase-hooks/storage';
import QRCode from 'react-qr-code';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { fbApp } from '@/db';
import { IconUpload, IconCheck } from '@tabler/icons';
import randomWords from 'random-words';

const storage = getStorage(fbApp);
const storageRef = ref(storage)

export default function Upload() {
  const id = useMemo(() => randomWords({ exactly: 3, join: '-' }), [])
  useEffect(() => console.log(id), [id])

  const [uploaded, setUploaded] = useState(false)

  return (
    <AppShell fixed padding={10}
      header={<Header />}
      footer={<Footer />}
    >
      <Center py="2rem">
        {
          uploaded
            ? <Receive id={id} />
            : <Send id={id} setUploaded={setUploaded} />
        }
      </Center>
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
      <Stack align="center" justify="center" spacing="lg" style={{ minHeight: 220, pointerEvents: 'none' }}>
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

  const copyButton = <Button onClick={() => copy(url)} color={copied ? 'green' : ''}>{copied ? 'Copied' : 'Copy'}</Button>;
  return (
    <Stack spacing="md" p="xl">
      <Title>
        File uploaded&nbsp;
        <ThemeIcon radius="xl" size="xl" color="green">
          <IconCheck />
        </ThemeIcon>
      </Title>
      <TextInput label="Download Link" value={url} readOnly rightSection={copyButton} />
      <Center>
        <QRCode value={url} />
      </Center>
      <Center>
        <Text color="dimmed"><Anchor onClick={() => window.location.reload()}>Refresh</Anchor> this page to upload a new file.</Text>
      </Center>
    </Stack>
  )
}
