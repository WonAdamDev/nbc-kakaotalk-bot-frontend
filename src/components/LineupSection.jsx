import { useState, useEffect } from 'react'
import axios from 'axios'
import EarlyLeaveModal from './EarlyLeaveModal'
import ArrivalModal from './ArrivalModal'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function LineupSection({ gameId, lineups, gameStatus, quarters, onUpdate, onLineupUpdate, roomName, onTeamChange }) {
  const [loading, setLoading] = useState(false)
  const [draggedPlayer, setDraggedPlayer] = useState(null)
  const [dragOverPlayer, setDragOverPlayer] = useState(null)
  const [showEarlyLeaveModal, setShowEarlyLeaveModal] = useState(false)
  const [showArrivalModal, setShowArrivalModal] = useState(false)

  // 팀 선택 드롭다운
  const [availableTeams, setAvailableTeams] = useState([])
  const [selectedTeamHome, setSelectedTeamHome] = useState('')
  const [selectedTeamAway, setSelectedTeamAway] = useState('')

  // 팀 목록 로드
  const loadTeams = async () => {
    if (!roomName) return

    try {
      const response = await axios.get(`${API_URL}/api/commands/team/list`, {
        params: { room: roomName }
      })
      if (response.data.success) {
        setAvailableTeams(response.data.data.teams || [])
      }
    } catch (err) {
      console.error('Failed to load teams:', err)
    }
  }

  // 컴포넌트 마운트 시 팀 목록 로드
  useEffect(() => {
    loadTeams()
  }, [roomName])

  // 팀 선택 변경 시 상위로 전달
  useEffect(() => {
    if (onTeamChange) {
      onTeamChange(selectedTeamHome, selectedTeamAway)
    }
  }, [selectedTeamHome, selectedTeamAway])

  // 진행중인 쿼터가 있는지 확인
  const hasOngoingQuarter = quarters?.some(q => q.status === '진행중') || false
  // 경기가 종료되지 않았고, 진행중인 쿼터가 없으면 순번 변경 가능
  const canSwapLineup = gameStatus !== '종료' && !hasOngoingQuarter
  // 경기가 종료되지 않았고, 진행중인 쿼터가 없으면 조퇴 가능
  const canRemovePlayer = gameStatus !== '종료' && !hasOngoingQuarter
  // 팀 선택 가능 여부 (경기 시작 전에만)
  const canSelectTeam = gameStatus === '준비중'

  const handleArrival = async (team, member) => {
    try {
      setLoading(true)
      await axios.post(`${API_URL}/api/game/${gameId}/lineup/arrival`, {
        team: team,
        member: member
      })
      // WebSocket이 자동으로 업데이트하므로 onUpdate() 호출 불필요
    } catch (err) {
      alert('도착 처리 실패: ' + (err.response?.data?.error || err.message))
      onUpdate() // 에러 발생 시에만 재로드
      throw err // 모달에서 에러 처리를 위해 throw
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (lineupId, memberName) => {
    const action = gameStatus === '준비중' ? '제거' : '조퇴 처리'
    if (!confirm(`${memberName}님을 ${action}하시겠습니까?`)) return

    try {
      setLoading(true)
      await axios.delete(`${API_URL}/api/game/${gameId}/lineup/${lineupId}`)
      // WebSocket이 자동으로 업데이트하므로 onUpdate() 호출 불필요
    } catch (err) {
      alert(`${action} 실패: ` + (err.response?.data?.error || err.message))
      onUpdate() // 에러 발생 시에만 재로드
    } finally {
      setLoading(false)
    }
  }

  // 드래그 시작
  const handleDragStart = (e, team, number, member) => {
    setDraggedPlayer({ team, number, member })
    e.dataTransfer.effectAllowed = 'move'
  }

  // 드래그 오버
  const handleDragOver = (e, team, number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'

    // 다른 팀 간 교체도 허용, 자기 자신은 제외
    if (draggedPlayer && !(draggedPlayer.team === team && draggedPlayer.number === number)) {
      setDragOverPlayer({ team, number })
    }
  }

  // 드래그 떠남
  const handleDragLeave = () => {
    setDragOverPlayer(null)
  }

  // 드롭
  const handleDrop = async (e, toTeam, toNumber) => {
    e.preventDefault()
    setDragOverPlayer(null)

    if (!draggedPlayer) {
      return
    }

    const fromTeam = draggedPlayer.team
    const fromNumber = draggedPlayer.number

    // 자기 자신에게 드롭하는 경우
    if (fromTeam === toTeam && fromNumber === toNumber) {
      setDraggedPlayer(null)
      return
    }

    try {
      setLoading(true)
      const response = await axios.put(`${API_URL}/api/game/${gameId}/lineup/swap`, {
        from_team: fromTeam,
        from_number: fromNumber,
        to_team: toTeam,
        to_number: toNumber
      })

      // 성공 시 영향받은 팀들의 라인업 업데이트
      if (response.data.success && response.data.data?.lineups && onLineupUpdate) {
        const updatedLineups = response.data.data.lineups
        // 영향받은 모든 팀 업데이트
        Object.keys(updatedLineups).forEach(team => {
          onLineupUpdate(team, updatedLineups[team])
        })
      } else {
        // onLineupUpdate가 없으면 전체 리로드 (fallback)
        onUpdate()
      }
    } catch (err) {
      alert('순번 변경 실패: ' + (err.response?.data?.error || err.message))
      onUpdate()
    } finally {
      setLoading(false)
      setDraggedPlayer(null)
    }
  }

  // 드래그 종료
  const handleDragEnd = () => {
    setDraggedPlayer(null)
    setDragOverPlayer(null)
  }

  return (
    <>
      {/* 조퇴 선수 선택 모달 */}
      <EarlyLeaveModal
        isOpen={showEarlyLeaveModal}
        onClose={() => setShowEarlyLeaveModal(false)}
        lineups={lineups}
        gameStatus={gameStatus}
        onSelectPlayer={handleRemove}
      />

      {/* 출석 처리 모달 */}
      <ArrivalModal
        isOpen={showArrivalModal}
        onClose={() => setShowArrivalModal(false)}
        onArrival={handleArrival}
        roomName={roomName}
      />

      <div className="card mb-6">
        <h2 className="text-xl font-bold mb-4">선수 도착 관리</h2>

        {/* 팀 선택 (경기 시작 전에만) */}
        {availableTeams.length > 0 && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-semibold mb-3">경기 팀 선택</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">HOME</label>
                <select
                  value={selectedTeamHome}
                  onChange={(e) => setSelectedTeamHome(e.target.value)}
                  disabled={!canSelectTeam}
                  className="input w-full"
                >
                  <option value="">팀 선택 안함</option>
                  {availableTeams.map((team) => (
                    <option key={team.name} value={team.name}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">AWAY</label>
                <select
                  value={selectedTeamAway}
                  onChange={(e) => setSelectedTeamAway(e.target.value)}
                  disabled={!canSelectTeam}
                  className="input w-full"
                >
                  <option value="">팀 선택 안함</option>
                  {availableTeams.map((team) => (
                    <option key={team.name} value={team.name}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {/* 유효성 검사 메시지 */}
            {selectedTeamHome && selectedTeamAway && selectedTeamHome === selectedTeamAway && (
              <p className="text-red-600 text-sm mt-2">⚠️ HOME과 AWAY는 서로 다른 팀이어야 합니다.</p>
            )}
            {(selectedTeamHome && !selectedTeamAway) || (!selectedTeamHome && selectedTeamAway) && (
              <p className="text-yellow-600 text-sm mt-2">⚠️ 두 팀 모두 선택하거나 둘 다 선택하지 않아야 합니다.</p>
            )}
            {!canSelectTeam && (selectedTeamHome || selectedTeamAway) && (
              <p className="text-gray-600 text-sm mt-2">ℹ️ 경기 시작 후에는 팀을 변경할 수 없습니다.</p>
            )}
          </div>
        )}

        {/* 출석 / 조퇴 버튼 */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            type="button"
            onClick={() => setShowArrivalModal(true)}
            className="btn btn-primary"
          >
            ✅ 출석
          </button>

          <button
            type="button"
            onClick={() => setShowEarlyLeaveModal(true)}
            disabled={!canRemovePlayer}
            className="btn btn-danger"
            title={hasOngoingQuarter ? '쿼터 진행 중에는 조퇴 처리할 수 없습니다' : '조퇴할 선수를 선택하세요'}
          >
            👋 조퇴
          </button>
        </div>

      {/* 팀별 라인업 */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* HOME */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <h3 className="text-lg font-semibold">HOME</h3>
            <span className="badge badge-blue">{lineups.블루?.length || 0}명</span>
            {canSwapLineup && (
              <span className="text-xs text-gray-500 ml-2">
                {hasOngoingQuarter ? '⏸️ 쿼터 진행중' : '✨ 드래그하여 순번 변경'}
              </span>
            )}
          </div>

          <div className="space-y-2">
            {lineups.블루?.length === 0 ? (
              <div
                onDragOver={(e) => {
                  if (!canSwapLineup) return
                  // 빈 팀에 드롭할 때는 다음 번호 (현재 선수 수 + 1)
                  const nextNumber = (lineups.블루?.length || 0) + 1
                  handleDragOver(e, '블루', nextNumber)
                }}
                onDragLeave={handleDragLeave}
                onDrop={(e) => {
                  if (!canSwapLineup) return
                  const nextNumber = (lineups.블루?.length || 0) + 1
                  handleDrop(e, '블루', nextNumber)
                }}
                className={`
                  p-8 rounded-lg border-2 border-dashed transition-all
                  ${dragOverPlayer?.team === '블루' ? 'border-blue-500 bg-blue-100' : 'border-gray-300 bg-gray-50'}
                  ${canSwapLineup && draggedPlayer ? 'hover:border-blue-400' : ''}
                `}
              >
                <p className="text-gray-500 text-sm text-center">
                  {canSwapLineup && draggedPlayer ? '여기에 드롭하여 팀 이동' : '도착한 선수가 없습니다.'}
                </p>
              </div>
            ) : (
              <>
                {lineups.블루?.map((lineup, idx) => {
                  const isDragging = draggedPlayer?.team === '블루' && draggedPlayer?.number === lineup.number
                  const isDropTarget = dragOverPlayer?.team === '블루' && dragOverPlayer?.number === lineup.number
                  const canDrag = canSwapLineup

                  return (
                    <div
                      key={idx}
                      draggable={canDrag}
                      onDragStart={(e) => canDrag && handleDragStart(e, '블루', lineup.number, lineup.member)}
                      onDragOver={(e) => canDrag && handleDragOver(e, '블루', lineup.number)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => canDrag && handleDrop(e, '블루', lineup.number)}
                      onDragEnd={handleDragEnd}
                      className={`
                        flex items-center justify-between p-3 rounded-lg border transition-all
                        ${isDragging ? 'opacity-50 scale-95' : ''}
                        ${isDropTarget ? 'border-blue-500 border-2 bg-blue-100' : 'bg-blue-50 border-blue-200'}
                        ${canDrag ? 'cursor-move hover:shadow-md' : ''}
                      `}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex flex-col items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-lg font-bold text-lg">
                          {lineup.number}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 text-lg">{lineup.member}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(lineup.arrived_at).toLocaleTimeString('ko-KR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* 마지막 빈칸 드롭존 */}
                {canSwapLineup && draggedPlayer && (
                  <div
                    onDragOver={(e) => {
                      const nextNumber = lineups.블루?.length > 0
                        ? Math.max(...lineups.블루.map(l => l.number)) + 1
                        : 1
                      handleDragOver(e, '블루', nextNumber)
                    }}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => {
                      const nextNumber = lineups.블루?.length > 0
                        ? Math.max(...lineups.블루.map(l => l.number)) + 1
                        : 1
                      handleDrop(e, '블루', nextNumber)
                    }}
                    className={`
                      p-6 rounded-lg border-2 border-dashed transition-all
                      ${dragOverPlayer?.team === '블루' && dragOverPlayer?.number === (lineups.블루?.length > 0 ? Math.max(...lineups.블루.map(l => l.number)) + 1 : 1) ? 'border-blue-500 bg-blue-100' : 'border-blue-300 bg-blue-50/30'}
                      hover:border-blue-400 hover:bg-blue-50
                    `}
                  >
                    <p className="text-blue-600 text-sm text-center font-medium">
                      + 여기에 드롭하여 마지막 순번으로 이동
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* AWAY */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-4 h-4 bg-gray-400 rounded border border-gray-600"></div>
            <h3 className="text-lg font-semibold">AWAY</h3>
            <span className="badge badge-white">{lineups.화이트?.length || 0}명</span>
            {canSwapLineup && (
              <span className="text-xs text-gray-500 ml-2">
                {hasOngoingQuarter ? '⏸️ 쿼터 진행중' : '✨ 드래그하여 순번 변경'}
              </span>
            )}
          </div>

          <div className="space-y-2">
            {lineups.화이트?.length === 0 ? (
              <div
                onDragOver={(e) => {
                  if (!canSwapLineup) return
                  // 빈 팀에 드롭할 때는 다음 번호 (현재 선수 수 + 1)
                  const nextNumber = (lineups.화이트?.length || 0) + 1
                  handleDragOver(e, '화이트', nextNumber)
                }}
                onDragLeave={handleDragLeave}
                onDrop={(e) => {
                  if (!canSwapLineup) return
                  const nextNumber = (lineups.화이트?.length || 0) + 1
                  handleDrop(e, '화이트', nextNumber)
                }}
                className={`
                  p-8 rounded-lg border-2 border-dashed transition-all
                  ${dragOverPlayer?.team === '화이트' ? 'border-gray-700 bg-gray-200' : 'border-gray-300 bg-gray-50'}
                  ${canSwapLineup && draggedPlayer ? 'hover:border-gray-600' : ''}
                `}
              >
                <p className="text-gray-500 text-sm text-center">
                  {canSwapLineup && draggedPlayer ? '여기에 드롭하여 팀 이동' : '도착한 선수가 없습니다.'}
                </p>
              </div>
            ) : (
              <>
                {lineups.화이트?.map((lineup, idx) => {
                  const isDragging = draggedPlayer?.team === '화이트' && draggedPlayer?.number === lineup.number
                  const isDropTarget = dragOverPlayer?.team === '화이트' && dragOverPlayer?.number === lineup.number
                  const canDrag = canSwapLineup

                  return (
                    <div
                      key={idx}
                      draggable={canDrag}
                      onDragStart={(e) => canDrag && handleDragStart(e, '화이트', lineup.number, lineup.member)}
                      onDragOver={(e) => canDrag && handleDragOver(e, '화이트', lineup.number)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => canDrag && handleDrop(e, '화이트', lineup.number)}
                      onDragEnd={handleDragEnd}
                      className={`
                        flex items-center justify-between p-3 rounded-lg border transition-all
                        ${isDragging ? 'opacity-50 scale-95' : ''}
                        ${isDropTarget ? 'border-gray-700 border-2 bg-gray-200' : 'bg-gray-50 border-gray-300'}
                        ${canDrag ? 'cursor-move hover:shadow-md' : ''}
                      `}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex flex-col items-center justify-center w-12 h-12 bg-gray-600 text-white rounded-lg font-bold text-lg">
                          {lineup.number}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 text-lg">{lineup.member}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(lineup.arrived_at).toLocaleTimeString('ko-KR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* 마지막 빈칸 드롭존 */}
                {canSwapLineup && draggedPlayer && (
                  <div
                    onDragOver={(e) => {
                      const nextNumber = lineups.화이트?.length > 0
                        ? Math.max(...lineups.화이트.map(l => l.number)) + 1
                        : 1
                      handleDragOver(e, '화이트', nextNumber)
                    }}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => {
                      const nextNumber = lineups.화이트?.length > 0
                        ? Math.max(...lineups.화이트.map(l => l.number)) + 1
                        : 1
                      handleDrop(e, '화이트', nextNumber)
                    }}
                    className={`
                      p-6 rounded-lg border-2 border-dashed transition-all
                      ${dragOverPlayer?.team === '화이트' && dragOverPlayer?.number === (lineups.화이트?.length > 0 ? Math.max(...lineups.화이트.map(l => l.number)) + 1 : 1) ? 'border-gray-700 bg-gray-200' : 'border-gray-400 bg-gray-50/30'}
                      hover:border-gray-600 hover:bg-gray-100
                    `}
                  >
                    <p className="text-gray-700 text-sm text-center font-medium">
                      + 여기에 드롭하여 마지막 순번으로 이동
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
