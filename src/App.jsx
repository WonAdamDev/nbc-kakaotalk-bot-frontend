import { Routes, Route } from 'react-router-dom'
import LandingPage from './components/LandingPage'
import RoomPage from './components/RoomPage'
import GamePage from './components/GamePage'
import NotFound from './components/NotFound'

function App() {
  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/room/:roomId" element={<RoomPage />} />
        <Route path="/game/:gameId" element={<GamePage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  )
}

export default App
