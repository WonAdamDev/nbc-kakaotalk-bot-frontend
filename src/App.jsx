import { Routes, Route } from 'react-router-dom'
import GamePage from './components/GamePage'
import NotFound from './components/NotFound'

function App() {
  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/game/:gameId" element={<GamePage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  )
}

export default App
