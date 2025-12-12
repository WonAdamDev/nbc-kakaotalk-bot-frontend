import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function GameControls({ game, gameId, onUpdate }) {
  const [loading, setLoading] = useState(false)
  const [showTeamSelectModal, setShowTeamSelectModal] = useState(false)
  const [availableTeams, setAvailableTeams] = useState([])
  const [selectedTeamHome, setSelectedTeamHome] = useState('')
  const [selectedTeamAway, setSelectedTeamAway] = useState('')

  // 팀 목록 로드
  const loadTeams = async () => {
    if (!game?.room) return

    try {
      const response = await axios.get(`${API_URL}/api/commands/team/list`, {
        params: { room: game.room }
      })
      if (response.data.success) {
        setAvailableTeams(response.data.data.teams || [])
      }
    } catch (err) {
      console.error('Failed to load teams:', err)
    }
  }

  // 모달 열릴 때 팀 목록 로드
  useEffect(() => {
    if (showTeamSelectModal && game?.room) {
      loadTeams()
    }
  }, [showTeamSelectModal, game?.room])

  const handleStartGameClick = () => {
    // 팀 선택 모달 표시
    setShowTeamSelectModal(true)
  }

  const handleStartGame = async () => {
    try {
      setLoading(true)

      // 팀 선택 여부에 따라 요청 본문 구성
      const requestBody = {}
      if (selectedTeamHome && selectedTeamAway) {
        requestBody.team_home = selectedTeamHome
        requestBody.team_away = selectedTeamAway
      }

      await axios.post(`${API_URL}/api/game/${gameId}/start`, requestBody)

      // 모달 닫기
      setShowTeamSelectModal(false)
      setSelectedTeamHome('')
      setSelectedTeamAway('')

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
    <>
      {/* 팀 선택 모달 */}
      {showTeamSelectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">팀 선택 (선택사항)</h2>
            <p className="text-sm text-gray-600 mb-4">
              {availableTeams.length > 0
                ? '경기에 사용할 팀을 선택하세요. 선택하지 않으면 팀 구분 없이 경기를 진행합니다.'
                : '이 방에 등록된 팀이 없습니다. 팀 구분 없이 경기를 진행합니다.'}
            </p>

            {availableTeams.length > 0 && (
              <div className="space-y-4 mb-6">
                {/* 홈팀 선택 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    홈팀 (블루)
                  </label>
                  <select
                    value={selectedTeamHome}
                    onChange={(e) => setSelectedTeamHome(e.target.value)}
                    className="input w-full"
                  >
                    <option value="">팀 선택 안함</option>
                    {availableTeams.map((team) => (
                      <option key={team.name} value={team.name}>
                        {team.name} ({team.member_count}명)
                      </option>
                    ))}
                  </select>
                </div>

                {/* 어웨이팀 선택 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    어웨이팀 (화이트)
                  </label>
                  <select
                    value={selectedTeamAway}
                    onChange={(e) => setSelectedTeamAway(e.target.value)}
                    className="input w-full"
                  >
                    <option value="">팀 선택 안함</option>
                    {availableTeams.map((team) => (
                      <option key={team.name} value={team.name}>
                        {team.name} ({team.member_count}명)
                      </option>
                    ))}
                  </select>
                </div>

                {/* 경고 메시지 */}
                {selectedTeamHome && selectedTeamAway && selectedTeamHome === selectedTeamAway && (
                  <p className="text-red-600 text-sm">
                    ⚠️ 홈팀과 어웨이팀은 서로 다른 팀이어야 합니다.
                  </p>
                )}
                {((selectedTeamHome && !selectedTeamAway) || (!selectedTeamHome && selectedTeamAway)) && (
                  <p className="text-amber-600 text-sm">
                    ⚠️ 두 팀 모두 선택하거나, 모두 선택하지 않아야 합니다.
                  </p>
                )}
              </div>
            )}

            {/* 버튼 */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowTeamSelectModal(false)
                  setSelectedTeamHome('')
                  setSelectedTeamAway('')
                }}
                disabled={loading}
                className="btn btn-secondary flex-1"
              >
                취소
              </button>
              <button
                onClick={handleStartGame}
                disabled={
                  loading ||
                  (selectedTeamHome && selectedTeamAway && selectedTeamHome === selectedTeamAway) ||
                  ((selectedTeamHome && !selectedTeamAway) || (!selectedTeamHome && selectedTeamAway))
                }
                className="btn btn-success flex-1"
              >
                경기 시작
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card mb-6">
        <h2 className="text-xl font-bold mb-4">경기 관리</h2>

        <div className="flex flex-wrap gap-3">
          {game.status === '준비중' && (
            <button
              onClick={handleStartGameClick}
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
        {game.status === '준비중' && '※ 선수 도착은 언제든 가능합니다. 경기를 시작하면 쿼터 관리가 가능합니다.'}
        {game.status === '진행중' && '※ 경기를 종료하면 최종 점수가 자동으로 계산됩니다.'}
        {game.status === '종료' && '※ 경기가 종료되었습니다.'}
      </p>
    </div>
    </>
  )
}
