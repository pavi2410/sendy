import { BrowserRouter, Routes, Route } from "react-router-dom"
import Download from "./Download"
import Upload from "./Upload"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<Upload />} />
        <Route path=":id" element={<Download />} />
      </Routes>
    </BrowserRouter>
  )
}