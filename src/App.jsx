import { BrowserRouter, Routes, Route } from "react-router-dom"
import Download from "@/pages/Download"
import Upload from "@/pages/Upload"

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