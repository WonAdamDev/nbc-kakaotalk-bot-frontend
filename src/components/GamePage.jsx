import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import useWebSocket from '../hooks/useWebSocket'
import GameHeader from './GameHeader'
import LineupSection from './LineupSection'
import QuarterSection from './QuarterSection'
import ScoreBoard from './ScoreBoard'
import GameControls from './GameControls'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function GamePage() {
  const { gameId } = useParams()
  const [game, setGame] = useState(null)
  const [lineups, setLineups] = useState({ 블루: [], 화이트: [] })
  const [quarters, setQuarters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 게임 데이터 로드
  const loadGameData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/api/game/${gameId}`)

      if (response.data.success) {
        setGame(response.data.data.game)
        setLineups(response.data.data.lineups)
        setQuarters(response.data.data.quarters)
        setError(null)
      }
    } catch (err) {
      console.error('Failed to load game:', err)
      setError('경기 정보를 불러올 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }, [gameId])

  // WebSocket 업데이트 핸들러
  const handleGameUpdate = useCallback((update) => {
    const { type, data } = update

    switch (type) {
      case 'game_state':
        // 전체 상태 업데이트
        setGame(data.game)
        setLineups(data.lineups)
        setQuarters(data.quarters)
        break

      case 'game_started':
      case 'game_ended':
        setGame(data)
        break

      case 'player_arrived':
        // 라인업에 선수 추가
        setLineups(prev => ({
          ...prev,
          [data.lineup.team]: [...prev[data.lineup.team], data.lineup]
        }))
        break

      case 'player_removed':
        // 라인업에서 선수 제거 후 재로드
        loadGameData()
        break

      case 'quarter_started':
      case 'quarter_ended':
        // 쿼터 업데이트
        loadGameData()
        break

      case 'score_updated':
        // 점수 업데이트
        setQuarters(prev =>
          prev.map(q =>
            q.quarter === data.quarter
              ? { ...q, score: { blue: data.score_blue, white: data.score_white } }
              : q
          )
        )
        break

      case 'game_deleted':
        setError('경기가 삭제되었습니다.')
        break

      default:
        console.log('Unknown update type:', type)
    }
  }, [loadGameData])

  // WebSocket 연결
  const { isConnected } = useWebSocket(gameId, handleGameUpdate)

  // 초기 데이터 로드
  useEffect(() => {
    loadGameData()
  }, [loadGameData])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">경기 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-xl mb-4">{error}</p>
          <button
            onClick={loadGameData}
            className="btn btn-primary"
          >
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">경기를 찾을 수 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 연결 상태 표시 */}
      <div className="fixed top-4 right-4 z-50">
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          isConnected
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {isConnected ? '🟢 실시간 연결됨' : '🔴 연결 끊김'}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <GameHeader game={game} />

        {/* 스코어보드 */}
        <ScoreBoard
          game={game}
          quarters={quarters}
        />

        {/* 경기 컨트롤 */}
        <GameControls
          game={game}
          gameId={gameId}
          onUpdate={loadGameData}
        />

        {/* 라인업 섹션 */}
        <LineupSection
          gameId={gameId}
          lineups={lineups}
          gameStatus={game.status}
          onUpdate={loadGameData}
        />

        {/* 쿼터 섹션 */}
        {game.status === '진행중' && (
          <QuarterSection
            gameId={gameId}
            game={game}
            quarters={quarters}
            lineups={lineups}
            onUpdate={loadGameData}
          />
        )}
      </div>
    </div>
  )
}
