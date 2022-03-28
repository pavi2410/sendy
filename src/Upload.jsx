import { fbApp } from './db'
import { Container, SimpleGrid, Title } from '@mantine/core'
import { Dropzone } from '@mantine/dropzone'
import { getStorage, ref } from 'firebase/storage';
import { useUploadFile } from 'react-firebase-hooks/storage'
import { useId } from '@mantine/hooks';
import QRCode from 'react-qr-code';

const storage = getStorage(fbApp);
const storageRef = ref(storage)

export default function Upload() {
  const id = useId(randomHex())

  return (
    <Container>
      <SimpleGrid cols={2}>
        <Send id={id} />
        <Receive id={id} />
      </SimpleGrid>

    </Container>
  )
}

function Send({ id }) {
  const [uploadFile, uploading, snapshot, error] = useUploadFile();

  async function onDrop(files) {
    const file = files[0];
    const result = await uploadFile(ref(storageRef, id), file, { customMetadata: { realFileName: file.name } });
    console.log(id, result)
  }

  return (
    <div>
      <Title>Send</Title>
      <Dropzone onDrop={onDrop} loading={uploading}>
        {
          (status) => (
            <div>{JSON.stringify(status, null, 2)}</div>
          )
        }
      </Dropzone>
    </div>
  )
}

function Receive({ id }) {

  return (
    <div>
      <Title>Receive {id}</Title>
      <QRCode value={window.location.origin + '/dl/' + id} />
    </div>
  )
}

function randomHex() {
  return Math.random().toString(16).substring(2, 10)
}