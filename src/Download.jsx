//@ts-check
import { useEffect, useMemo, useState } from 'react';
import { fbApp } from './db'
import { getMetadata, getStorage, ref } from "firebase/storage";
import { useDownloadURL } from "react-firebase-hooks/storage";
import { useParams } from "react-router-dom"
import { Box, Button, Center, Container, Group, Header, Loader, Paper, Stack, Text, Title } from '@mantine/core';
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
    return <Loader color="green" variant="dots" />
  }
  if (error) {
    return <div>Invalid code</div>
  }
  return (
    <Container>
      <Header height={60}>
        <Group position="apart" sx={{ height: '100%' }} px={20}>
          <Title>sendy</Title>
          <Button variant="light">Upload</Button>
        </Group>
      </Header>
      <Center sx={{ paddingTop: '1rem' }}>
        <Box style={{ backgroundColor: "#f8fafc", borderRadius: '.5rem' }} p="xl">
          <FileInfo meta={meta} />
          <Button color="dark" radius="md" size="md" fullWidth style={{ marginTop: '1rem' }} component="a" href={value} download>
            Download
          </Button>
        </Box>
      </Center>
    </Container>
  )
}

function FileInfo({ meta }) {
  if (!meta) {
    return <Loader color="lime" variant="dots" />
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