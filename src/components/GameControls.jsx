import { useState } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function GameControls({ game, gameId, onUpdate, teamHome, teamAway }) {
  const [loading, setLoading] = useState(false)

  // 경기 시작 가능 여부 검증
  const canStartGame = () => {
    // 팀 선택 여부 확인
    if (!teamHome || !teamAway) {
      return false
    }
    // 서로 다른 팀인지 확인
    if (teamHome === teamAway) {
      return false
    }
    return true
  }

  // 경기 시작 불가능한 이유 반환
  const getStartGameDisabledReason = () => {
    if (!teamHome && !teamAway) {
      return 'HOME과 AWAY 팀을 선택해주세요.'
    }
    if (!teamHome) {
      return 'HOME 팀을 선택해주세요.'
    }
    if (!teamAway) {
      return 'AWAY 팀을 선택해주세요.'
    }
    if (teamHome === teamAway) {
      return 'HOME과 AWAY는 서로 다른 팀이어야 합니다.'
    }
    return null
  }

  const handleStartGame = async () => {
    // 팀 선택 검증
    if (!teamHome || !teamAway) {
      alert('HOME과 AWAY 팀을 모두 선택해주세요.')
      return
    }

    if (teamHome === teamAway) {
      alert('HOME과 AWAY는 서로 다른 팀이어야 합니다.')
      return
    }

    if (!confirm('경기를 시작하시겠습니까?')) return

    try {
      setLoading(true)

      // 팀 정보 전송
      const requestBody = {
        team_home: teamHome,
        team_away: teamAway
      }

      await axios.post(`${API_URL}/api/game/${gameId}/start`, requestBody)

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


  return (
    <div className="card mb-6">
        <h2 className="text-xl font-bold mb-4">경기 관리</h2>

        <div className="flex flex-wrap gap-3">
          {game.status === '준비중' && (
            <button
              onClick={handleStartGame}
              disabled={loading || !canStartGame()}
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
      </div>

      {game.status === '준비중' && (
        <div className="mt-3">
          {!canStartGame() && (
            <p className="text-sm text-red-600 font-medium">
              ⚠️ {getStartGameDisabledReason()}
            </p>
          )}
          {canStartGame() && (
            <p className="text-sm text-gray-500">
              ✅ 경기를 시작할 수 있습니다.
            </p>
          )}
        </div>
      )}

      {game.status === '진행중' && (
        <p className="text-sm text-gray-500 mt-3">
          ※ 경기를 종료하면 최종 점수가 자동으로 계산됩니다.
        </p>
      )}

      {game.status === '종료' && (
        <p className="text-sm text-gray-500 mt-3">
          ※ 경기가 종료되었습니다.
        </p>
      )}
    </div>
  )
}
