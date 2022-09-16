import { AppShell, Button, Center, Group, Modal, Stack, Text, TextInput, Title } from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import { useClipboard, useId } from '@mantine/hooks';
import { getStorage, ref } from 'firebase/storage';
import React, { useEffect, useState } from 'react';
import { useUploadFile } from 'react-firebase-hooks/storage';
import QRCode from 'react-qr-code';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { fbApp } from '@/db';
import { IconUpload } from '@tabler/icons';

const storage = getStorage(fbApp);
const storageRef = ref(storage)

export default function Upload() {
  const id = useId(randomHex())
  useEffect(() => console.log(id), [id])

  const [opened, setOpened] = useState(false)

  return (
    <AppShell fixed padding={10}
      header={<Header />}
      footer={<Footer />}
    >
      <Send id={id} setOpened={setOpened} />
      <Modal
        withCloseButton={false}
        overlayOpacity={0.5}
        overlayBlur={3}
        transition="slide-up"
        transitionDuration={300}
        transitionTimingFunction="ease"
        opened={opened}
        onClose={() => setOpened(false)}>
        <Receive id={id} />
      </Modal>
    </AppShell>
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
      <Dropzone
        maxFiles={1}
        maxSize={50 * 1024 * 1024}
        padding="xl"
        onDrop={onDrop}
        loading={uploading}
      >
        <Stack align="center" justify="center" spacing="lg" style={{ minHeight: 220, pointerEvents: 'none' }}>
          <IconUpload size={48} />
          <Text size="xl" inline>
            Drop a file here or click to select file
          </Text>
          <Text size="sm" color="dimmed" inline mt={7}>
            File size should not exceed 50MB
          </Text>
        </Stack>
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