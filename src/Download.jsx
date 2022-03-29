//@ts-check
import { useEffect, useMemo, useState } from 'react';
import { fbApp } from './db'
import { getMetadata, getStorage, ref } from "firebase/storage";
import { useDownloadURL } from "react-firebase-hooks/storage";
import { useParams } from "react-router-dom"
import { Box, Button, Center, Container, Group, Header, Loader, Stack, Text, Title, Footer, Anchor, Alert, Skeleton } from '@mantine/core';
import prettyBytes from 'pretty-bytes';

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
    <Container>
      <Header height={60}>
        <Group position="apart" sx={{ height: '100%' }} px={20}>
          <Title>sendy</Title>
          <Button variant="light" component="a" href="/">Upload</Button>
        </Group>
      </Header>
      <Center sx={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <Box style={{ backgroundColor: "#f8fafc", borderRadius: '.5rem' }} p="xl">
          <FileInfo meta={meta} />
          <Button color="dark" radius="md" size="md" fullWidth style={{ marginTop: '1rem' }} component="a" href={value} download={meta?.customMetadata.realFileName ?? ''}>
            Download
          </Button>
        </Box>
      </Center>
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