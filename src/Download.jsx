//@ts-check
import { Alert, AppShell, Box, Button, Center, Footer, Header, Loader, Skeleton, Stack } from '@mantine/core';
import { getMetadata, getStorage, ref } from "firebase/storage";
import prettyBytes from 'pretty-bytes';
import React, { useEffect, useMemo, useState } from 'react';
import { useDownloadURL } from "react-firebase-hooks/storage";
import { useParams } from "react-router-dom";
import { fbApp } from './db';

const storage = getStorage(fbApp);

export default function Download() {
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
      <Center sx={{ height: '100vh' }}>
        <Loader size="xl" variant="dots" />
      </Center>
    )
  }

  if (error) {
    return (
      <Center sx={{ height: '100vh' }}>
        <Alert title="Invalid Code" color="red" radius="md">
          The code is invalid... Make sure you have the correct link.
        </Alert>
      </Center>
    )
  }

  return (
    <AppShell
      header={<Header />}
      footer={<Footer />}
    >
      <Center sx={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <Box style={{ backgroundColor: "#f8fafc", borderRadius: '.5rem' }} p="xl">
          <FileInfo meta={meta} />
          <Button color="dark" radius="md" size="md" fullWidth style={{ marginTop: '1rem' }} component="a" href={value} download={meta?.customMetadata.realFileName ?? ''}>
            Download
          </Button>
        </Box>
      </Center>
    </AppShell>
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