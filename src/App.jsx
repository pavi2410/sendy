import { MantineProvider } from "@mantine/core"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import Download from "@/pages/Download"
import Upload from "@/pages/Upload"

export default function App() {

  return (
    <MantineProvider defaultColorScheme="auto">
      <BrowserRouter>
        <Routes>
          <Route index element={<Upload />} />
          <Route path=":id" element={<Download />} />
        </Routes>
      </BrowserRouter>
    </MantineProvider>
  )
}