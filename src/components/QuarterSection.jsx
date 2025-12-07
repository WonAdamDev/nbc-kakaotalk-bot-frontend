import { useState } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function QuarterSection({ gameId, game, quarters, lineups, onUpdate }) {
  const [loading, setLoading] = useState(false)
  const [scoreInputs, setScoreInputs] = useState({})

  const currentQuarter = quarters.find(q => q.status === '진행중')
  const canStartNewQuarter = !currentQuarter && quarters.length < 10 // 최대 10쿼터

  const handleStartQuarter = async () => {
    const blueCount = lineups.블루?.length || 0
    const whiteCount = lineups.화이트?.length || 0

    if (blueCount < 5 || whiteCount < 5) {
      alert('각 팀은 최소 5명의 선수가 필요합니다.')
      return
    }

    if (!confirm('새 쿼터를 시작하시겠습니까?')) return

    try {
      setLoading(true)
      await axios.post(`${API_URL}/api/game/${gameId}/quarter/start`)
      onUpdate()
    } catch (err) {
      alert('쿼터 시작 실패: ' + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }

  const handleEndQuarter = async (quarterNumber) => {
    if (!confirm(`${quarterNumber}쿼터를 종료하시겠습니까?`)) return

    try {
      setLoading(true)
      await axios.post(`${API_URL}/api/game/${gameId}/quarter/${quarterNumber}/end`)
      onUpdate()
    } catch (err) {
      alert('쿼터 종료 실패: ' + (err.response?.data?.error || err.message))
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
      onUpdate()
      // 입력 필드 초기화
      setScoreInputs(prev => ({ ...prev, [quarterNumber]: { blue: '', white: '' } }))
    } catch (err) {
      alert('점수 업데이트 실패: ' + (err.response?.data?.error || err.message))
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

  // 선수 번호로 이름 찾기
  const getMemberName = (team, number) => {
    const lineup = lineups[team]?.find(l => l.number === number)
    return lineup ? lineup.member : `#${number}`
  }

  return (
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
            ※ 자동 로테이션: 이전 쿼터 벤치 선수들이 역순으로 먼저 출전합니다.
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

                {quarter.status === '진행중' && (
                  <button
                    onClick={() => handleEndQuarter(quarter.quarter)}
                    disabled={loading}
                    className="btn btn-secondary text-sm"
                  >
                    ⏹️ 종료
                  </button>
                )}
              </div>

              {/* 출전 선수 / 벤치 */}
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                {/* 블루팀 */}
                <div>
                  <p className="text-sm font-semibold text-blue-600 mb-2">블루팀</p>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">출전 (코트)</p>
                      <div className="flex flex-wrap gap-1">
                        {quarter.playing?.blue?.map(num => (
                          <span
                            key={num}
                            className="px-2 py-1 bg-blue-500 text-white rounded text-sm font-medium"
                          >
                            {num}. {getMemberName('블루', num)}
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
                            {num}. {getMemberName('블루', num)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 화이트팀 */}
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2">화이트팀</p>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">출전 (코트)</p>
                      <div className="flex flex-wrap gap-1">
                        {quarter.playing?.white?.map(num => (
                          <span
                            key={num}
                            className="px-2 py-1 bg-gray-600 text-white rounded text-sm font-medium"
                          >
                            {num}. {getMemberName('화이트', num)}
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
                            {num}. {getMemberName('화이트', num)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 점수 입력/표시 */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm font-semibold mb-2">점수</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">블루:</span>
                    <input
                      type="number"
                      min="0"
                      value={scoreInputs[quarter.quarter]?.blue ?? quarter.score?.blue ?? 0}
                      onChange={(e) => handleScoreChange(quarter.quarter, 'blue', e.target.value)}
                      className="input w-20 text-center"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">화이트:</span>
                    <input
                      type="number"
                      min="0"
                      value={scoreInputs[quarter.quarter]?.white ?? quarter.score?.white ?? 0}
                      onChange={(e) => handleScoreChange(quarter.quarter, 'white', e.target.value)}
                      className="input w-20 text-center"
                    />
                  </div>

                  <button
                    onClick={() => handleUpdateScore(quarter.quarter)}
                    disabled={loading}
                    className="btn btn-primary text-sm"
                  >
                    💾 저장
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
