import { ColorSchemeProvider, MantineProvider } from "@mantine/core"
import { useColorScheme, useLocalStorage } from "@mantine/hooks";
import { BrowserRouter, Routes, Route } from "react-router-dom"
import Download from "@/pages/Download"
import Upload from "@/pages/Upload"

export default function App() {
  const preferredColorScheme = useColorScheme();
  const [colorScheme, setColorScheme] = useLocalStorage({
    key: 'color-scheme',
    defaultValue: preferredColorScheme,
    getInitialValueInEffect: true,
  });

  function toggleColorScheme(value) {
    setColorScheme(value || (colorScheme === 'dark' ? 'light' : 'dark'));
  }

  return (
    <ColorSchemeProvider colorScheme={colorScheme} toggleColorScheme={toggleColorScheme}>
      <MantineProvider
        theme={{ colorScheme }}
        withGlobalStyles
        withNormalizeCSS>
        <BrowserRouter>
          <Routes>
            <Route index element={<Upload />} />
            <Route path=":id" element={<Download />} />
          </Routes>
        </BrowserRouter>
      </MantineProvider>
    </ColorSchemeProvider>
  )
}