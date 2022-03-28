import { fbApp } from './db'
import { getStorage, ref } from "firebase/storage";
import { useDownloadURL } from "react-firebase-hooks/storage";
import { useParams } from "react-router-dom"

const storage = getStorage(fbApp);

export default function Download() {
  const { id } = useParams()

  const [value, loading, error] = useDownloadURL(ref(storage, id));

  if (loading) {
    return <div>Loading...</div>
  }
  return (
    <div>{value}</div>
  )
}