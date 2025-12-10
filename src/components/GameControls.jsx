import { useState } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function GameControls({ game, gameId, onUpdate }) {
  const [loading, setLoading] = useState(false)

  const handleStartGame = async () => {
    if (!confirm('경기를 시작하시겠습니까?')) return

    try {
      setLoading(true)
      await axios.post(`${API_URL}/api/game/${gameId}/start`, {})
      // WebSocket이 자동으로 업데이트
    } catch (err) {
      alert('경기 시작 실패: ' + (err.response?.data?.error || err.message))
      onUpdate() // 에러 발생 시에만 재로드
    } finally {
      setLoading(false)
    }
  }

  const handleEndGame = async () => {
    if (!confirm('경기를 종료하시겠습니까? 모든 쿼터의 점수가 합산됩니다.')) return

    try {
      setLoading(true)
      await axios.post(`${API_URL}/api/game/${gameId}/end`, {})
      // WebSocket이 자동으로 업데이트
    } catch (err) {
      alert('경기 종료 실패: ' + (err.response?.data?.error || err.message))
      onUpdate() // 에러 발생 시에만 재로드
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteGame = async () => {
    if (!confirm('정말로 경기를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return
    if (!confirm('모든 라인업과 쿼터 데이터가 함께 삭제됩니다. 계속하시겠습니까?')) return

    try {
      setLoading(true)
      await axios.delete(`${API_URL}/api/game/${gameId}`)
      alert('경기가 삭제되었습니다.')
      // 삭제 후 리다이렉트는 별도로 처리 가능
    } catch (err) {
      alert('경기 삭제 실패: ' + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card mb-6">
      <h2 className="text-xl font-bold mb-4">경기 관리</h2>

      <div className="flex flex-wrap gap-3">
        {game.status === '준비중' && (
          <button
            onClick={handleStartGame}
            disabled={loading}
            className="btn btn-success"
          >
            ▶️ 경기 시작
          </button>
        )}

        {game.status === '진행중' && (
          <button
            onClick={handleEndGame}
            disabled={loading}
            className="btn btn-primary"
          >
            ⏹️ 경기 종료
          </button>
        )}

        {game.status !== '종료' && (
          <button
            onClick={handleDeleteGame}
            disabled={loading}
            className="btn btn-danger"
          >
            🗑️ 경기 삭제
          </button>
        )}
      </div>

      <p className="text-sm text-gray-500 mt-3">
        {game.status === '준비중' && '※ 경기를 시작하면 선수 도착 및 쿼터 관리가 가능합니다.'}
        {game.status === '진행중' && '※ 경기를 종료하면 최종 점수가 자동으로 계산됩니다.'}
        {game.status === '종료' && '※ 경기가 종료되었습니다.'}
      </p>
    </div>
  )
}
