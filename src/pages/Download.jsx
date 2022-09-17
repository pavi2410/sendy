import { Alert, AppShell, Button, Card, Center, Loader, Skeleton, Stack } from '@mantine/core';
import { getMetadata, getStorage, ref } from "firebase/storage";
import prettyBytes from 'pretty-bytes';
import React, { useEffect, useMemo, useState } from 'react';
import { useDownloadURL } from "react-firebase-hooks/storage";
import { useParams } from "react-router-dom";
import { fbApp } from '@/db';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';

const storage = getStorage(fbApp);

export default function Download() {
  return (
    <AppShell
      header={<Header />}
      footer={<Footer />}
    >
      <Content />
    </AppShell>
  )
}

function Content() {
  const { id } = useParams()
  const fileRef = useMemo(() => ref(storage, id), [id])
  const [value, loading, error] = useDownloadURL(fileRef);
  const [meta, setMeta] = useState(null)

  useEffect(() => {
    getMetadata(fileRef).then(metadata => {
      setMeta(metadata)
    })
  }, [fileRef])

  if (loading) {
    return (
      <Center style={{ height: '100%' }}>
        <Loader size="xl" variant="dots" />
      </Center>
    )
  }

  if (error) {
    return (
      <Center style={{ height: '100%' }}>
        <Alert title="Invalid Code" color="red" radius="md">
          The code is invalid... Make sure you have the correct link.
        </Alert>
      </Center>
    )
  }

  return (
    <Center sx={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <Card shadow="sm" radius="md" p="lg" withBorder>
        <FileInfo meta={meta} />
        <Button color="dark" radius="md" size="md" fullWidth style={{ marginTop: '1rem' }} component="a" href={value}>
          Download
        </Button>
      </Card>
    </Center>
  )
}

function FileInfo({ meta }) {
  if (!meta) {
    return (
      <Stack spacing="lg">
        <Skeleton width="30ch" height="1rem" radius="xl" />
        <Skeleton width="30ch" height="1rem" radius="xl" />
        <Skeleton width="30ch" height="1rem" radius="xl" />
        <Skeleton width="30ch" height="1rem" radius="xl" />
      </Stack>
    )
  }

  return (
    <Stack spacing="lg">
      <div>Name <b>{meta.customMetadata.realFileName}</b></div>
      <div>Size <b>{prettyBytes(meta.size)}</b></div>
      <div>Type <b>{meta.contentType}</b></div>
      <div>Uploaded <b>{new Date(meta.timeCreated).toLocaleString()}</b></div>
    </Stack>
  )
}