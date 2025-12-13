import { useState } from 'react'
import axios from 'axios'
import QuarterStartModal from './QuarterStartModal'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function QuarterSection({ gameId, game, quarters, lineups, onUpdate }) {
  const [loading, setLoading] = useState(false)
  const [scoreInputs, setScoreInputs] = useState({})
  const [showModal, setShowModal] = useState(false)
  const [preview, setPreview] = useState(null)

  // 팀 이름 표시 (팀 선택 전: HOME/AWAY, 선택 후: 팀 이름)
  const homeTeamName = game.team_home || 'HOME'
  const awayTeamName = game.team_away || 'AWAY'

  const currentQuarter = quarters.find(q => q.status === '진행중')
  const canStartNewQuarter = game.status === '진행중' && !currentQuarter && quarters.length < 10 // 최대 10쿼터

  const handleStartQuarter = async () => {
    const blueCount = lineups.블루?.length || 0
    const whiteCount = lineups.화이트?.length || 0

    if (blueCount < 5 || whiteCount < 5) {
      alert('각 팀은 최소 5명의 선수가 필요합니다.')
      return
    }

    // 다음 쿼터 번호 계산
    const nextQuarterNumber = quarters.length + 1

    // 수동 선택 모달 열기
    setPreview({ quarter_number: nextQuarterNumber })
    setShowModal(true)
  }

  const handleConfirmStart = async (lineup) => {
    try {
      setLoading(true)
      await axios.post(`${API_URL}/api/game/${gameId}/quarter/start`, lineup)
      setShowModal(false)
      setPreview(null)
      // WebSocket이 자동으로 업데이트
    } catch (err) {
      alert('쿼터 시작 실패: ' + (err.response?.data?.error || err.message))
      onUpdate() // 에러 발생 시에만 재로드
    } finally {
      setLoading(false)
    }
  }

  const handleEndQuarter = async (quarterNumber) => {
    if (!confirm(`${quarterNumber}쿼터를 종료하시겠습니까?`)) return

    try {
      setLoading(true)
      await axios.post(`${API_URL}/api/game/${gameId}/quarter/${quarterNumber}/end`, {})
      // WebSocket이 자동으로 업데이트
    } catch (err) {
      alert('쿼터 종료 실패: ' + (err.response?.data?.error || err.message))
      onUpdate() // 에러 발생 시에만 재로드
    } finally {
      setLoading(false)
    }
  }

  const handleCancelQuarter = async (quarterNumber) => {
    if (!confirm(`${quarterNumber}쿼터를 취소하시겠습니까?\n(쿼터 기록이 삭제되고 출전 선수를 다시 선택할 수 있습니다)`)) return

    try {
      setLoading(true)
      await axios.delete(`${API_URL}/api/game/${gameId}/quarter/${quarterNumber}/cancel`)
      // WebSocket이 자동으로 업데이트
    } catch (err) {
      alert('쿼터 취소 실패: ' + (err.response?.data?.error || err.message))
      onUpdate() // 에러 발생 시에만 재로드
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateScore = async (quarterNumber) => {
    const scores = scoreInputs[quarterNumber]
    if (!scores) return

    const scoreBlue = parseInt(scores.blue) || 0
    const scoreWhite = parseInt(scores.white) || 0

    try {
      setLoading(true)
      await axios.put(`${API_URL}/api/game/${gameId}/quarter/${quarterNumber}/score`, {
        score_blue: scoreBlue,
        score_white: scoreWhite
      })
      // 입력 필드 초기화 (해당 쿼터 제거하여 quarter.score로 fallback)
      setScoreInputs(prev => {
        const newInputs = { ...prev }
        delete newInputs[quarterNumber]
        return newInputs
      })
      // WebSocket이 자동으로 업데이트
    } catch (err) {
      alert('점수 업데이트 실패: ' + (err.response?.data?.error || err.message))
      onUpdate() // 에러 발생 시에만 재로드
    } finally {
      setLoading(false)
    }
  }

  const handleScoreChange = (quarterNumber, team, value) => {
    setScoreInputs(prev => ({
      ...prev,
      [quarterNumber]: {
        ...(prev[quarterNumber] || {}),
        [team]: value
      }
    }))
  }

  // 선수 번호로 이름 찾기 (쿼터 스냅샷 우선, 동명이인 있으면 ID 표시)
  const getMemberName = (team, number, quarter) => {
    let memberName = null
    let memberId = null

    // 쿼터에 스냅샷이 있으면 스냅샷에서 찾기 (과거 쿼터 보호)
    if (quarter?.lineup_snapshot && quarter.lineup_snapshot[team]) {
      const snapshot = quarter.lineup_snapshot[team][String(number)]
      if (snapshot) {
        // 새 구조: {name, member_id, is_guest}
        if (typeof snapshot === 'object') {
          memberName = snapshot.name
          memberId = snapshot.member_id
          console.log(`[Snapshot] Q${quarter.quarter} ${team} #${number}: ${memberName} (ID: ${memberId})`)
        } else {
          // 구 구조 (하위 호환): 문자열
          memberName = snapshot
          console.log(`[Snapshot Legacy] Q${quarter.quarter} ${team} #${number}: ${memberName}`)
        }
      }
    } else {
      console.log(`[No Snapshot] Q${quarter?.quarter} - Using current lineup for ${team} #${number}`)
    }

    // 스냅샷이 없거나 해당 번호가 없으면 현재 라인업에서 찾기
    if (!memberName) {
      const lineup = lineups[team]?.find(l => l.number === number)
      if (lineup) {
        memberName = lineup.member
        memberId = lineup.member_id
      }
    }

    // 둘 다 없으면 번호만 표시
    if (!memberName) {
      return `#${number}`
    }

    // 동명이인 확인 (현재 라인업 기준)
    const allLineups = [...(lineups?.블루 || []), ...(lineups?.화이트 || [])]
    const duplicateNames = allLineups.filter(l => l.member === memberName)
    const hasDuplicate = duplicateNames.length > 1

    // 동명이인이 있고 member_id가 있으면 ID 표시
    if (hasDuplicate && memberId) {
      return `${memberName} #${memberId.slice(-4)}`
    }

    return memberName
  }

  return (
    <>
      {/* 쿼터 시작 모달 */}
      <QuarterStartModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        preview={preview}
        lineups={lineups}
        game={game}
        onConfirm={handleConfirmStart}
      />

      <div className="card">
        <h2 className="text-xl font-bold mb-4">쿼터 관리</h2>

        {/* 새 쿼터 시작 버튼 */}
        {canStartNewQuarter && (
          <div className="mb-6">
            <button
              onClick={handleStartQuarter}
              disabled={loading}
              className="btn btn-success"
            >
              🏀 {quarters.length === 0 ? '1쿼터 시작' : `${quarters.length + 1}쿼터 시작`}
            </button>
            <p className="text-sm text-gray-500 mt-2">
              ※ 출전 선수를 직접 선택하여 쿼터를 시작합니다.
            </p>
          </div>
        )}

      {/* 쿼터 목록 */}
      <div className="space-y-4">
        {quarters.length === 0 ? (
          <p className="text-gray-500">아직 시작된 쿼터가 없습니다.</p>
        ) : (
          quarters.map((quarter) => (
            <div
              key={quarter.quarter}
              className={`p-4 rounded-lg border-2 ${
                quarter.status === '진행중'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 bg-white'
              }`}
            >
              {/* 쿼터 헤더 */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold">Q{quarter.quarter}</h3>
                  <span className={`badge ${
                    quarter.status === '진행중' ? 'badge-success' : 'badge-secondary'
                  }`}>
                    {quarter.status}
                  </span>
                </div>

                {quarter.status === '진행중' && game.status !== '종료' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCancelQuarter(quarter.quarter)}
                      disabled={loading}
                      className="btn btn-danger text-sm"
                      title="쿼터를 취소하고 출전 선수를 다시 선택할 수 있습니다"
                    >
                      ❌ 취소
                    </button>
                    <button
                      onClick={() => handleEndQuarter(quarter.quarter)}
                      disabled={loading}
                      className="btn btn-secondary text-sm"
                    >
                      ⏹️ 종료
                    </button>
                  </div>
                )}
              </div>

              {/* 출전 선수 / 벤치 */}
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                {/* HOME */}
                <div>
                  <p className="text-sm font-semibold text-blue-600 mb-2">{homeTeamName}</p>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">출전 (코트)</p>
                      <div className="flex flex-wrap gap-1">
                        {quarter.playing?.blue?.map(num => (
                          <span
                            key={num}
                            className="px-2 py-1 bg-blue-500 text-white rounded text-sm font-medium"
                          >
                            {num}. {getMemberName('블루', num, quarter)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">벤치</p>
                      <div className="flex flex-wrap gap-1">
                        {quarter.bench?.blue?.map(num => (
                          <span
                            key={num}
                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm"
                          >
                            {num}. {getMemberName('블루', num, quarter)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* AWAY */}
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2">{awayTeamName}</p>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">출전 (코트)</p>
                      <div className="flex flex-wrap gap-1">
                        {quarter.playing?.white?.map(num => (
                          <span
                            key={num}
                            className="px-2 py-1 bg-gray-600 text-white rounded text-sm font-medium"
                          >
                            {num}. {getMemberName('화이트', num, quarter)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">벤치</p>
                      <div className="flex flex-wrap gap-1">
                        {quarter.bench?.white?.map(num => (
                          <span
                            key={num}
                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm border border-gray-300"
                          >
                            {num}. {getMemberName('화이트', num, quarter)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 점수 입력/표시 */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm font-semibold mb-2">누적 점수</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{homeTeamName}:</span>
                    <input
                      type="number"
                      min="0"
                      value={scoreInputs[quarter.quarter]?.blue ?? quarter.score?.blue ?? 0}
                      onChange={(e) => handleScoreChange(quarter.quarter, 'blue', e.target.value)}
                      disabled={game.status === '종료'}
                      className="input w-20 text-center"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{awayTeamName}:</span>
                    <input
                      type="number"
                      min="0"
                      value={scoreInputs[quarter.quarter]?.white ?? quarter.score?.white ?? 0}
                      onChange={(e) => handleScoreChange(quarter.quarter, 'white', e.target.value)}
                      disabled={game.status === '종료'}
                      className="input w-20 text-center"
                    />
                  </div>

                  {game.status !== '종료' && (
                    <button
                      onClick={() => handleUpdateScore(quarter.quarter)}
                      disabled={loading}
                      className="btn btn-primary text-sm"
                    >
                      💾 저장
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
    </>
  )
}
