import { useState } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function LineupSection({ gameId, lineups, gameStatus, onUpdate }) {
  const [selectedTeam, setSelectedTeam] = useState('블루')
  const [memberName, setMemberName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleArrival = async (e) => {
    e.preventDefault()
    if (!memberName.trim()) return

    try {
      setLoading(true)
      await axios.post(`${API_URL}/api/game/${gameId}/lineup/arrival`, {
        team: selectedTeam,
        member: memberName.trim()
      })
      setMemberName('')
      onUpdate()
    } catch (err) {
      alert('도착 처리 실패: ' + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (lineupId, memberName) => {
    if (!confirm(`${memberName}님을 제거하시겠습니까?`)) return

    try {
      setLoading(true)
      await axios.delete(`${API_URL}/api/game/${gameId}/lineup/${lineupId}`)
      onUpdate()
    } catch (err) {
      alert('제거 실패: ' + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card mb-6">
      <h2 className="text-xl font-bold mb-4">선수 도착 관리</h2>

      {/* 도착 처리 폼 */}
      <form onSubmit={handleArrival} className="mb-6">
        <div className="flex flex-wrap gap-3">
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="input"
          >
            <option value="블루">블루팀</option>
            <option value="화이트">화이트팀</option>
          </select>

          <input
            type="text"
            value={memberName}
            onChange={(e) => setMemberName(e.target.value)}
            placeholder="선수 이름"
            className="input flex-1 min-w-[200px]"
          />

          <button
            type="submit"
            disabled={loading || !memberName.trim()}
            className="btn btn-primary"
          >
            ✅ 도착 처리
          </button>
        </div>
      </form>

      {/* 팀별 라인업 */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* 블루팀 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <h3 className="text-lg font-semibold">블루팀</h3>
            <span className="badge badge-blue">{lineups.블루?.length || 0}명</span>
          </div>

          <div className="space-y-2">
            {lineups.블루?.length === 0 ? (
              <p className="text-gray-500 text-sm">도착한 선수가 없습니다.</p>
            ) : (
              lineups.블루?.map((lineup, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-blue-700">
                      {lineup.number}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{lineup.member}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(lineup.arrived_at).toLocaleTimeString('ko-KR')}
                      </p>
                    </div>
                  </div>

                  {gameStatus === '준비중' && (
                    <button
                      onClick={() => handleRemove(idx + 1, lineup.member)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      ❌
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* 화이트팀 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-4 h-4 bg-gray-400 rounded border border-gray-600"></div>
            <h3 className="text-lg font-semibold">화이트팀</h3>
            <span className="badge badge-white">{lineups.화이트?.length || 0}명</span>
          </div>

          <div className="space-y-2">
            {lineups.화이트?.length === 0 ? (
              <p className="text-gray-500 text-sm">도착한 선수가 없습니다.</p>
            ) : (
              lineups.화이트?.map((lineup, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-300"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-700">
                      {lineup.number}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{lineup.member}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(lineup.arrived_at).toLocaleTimeString('ko-KR')}
                      </p>
                    </div>
                  </div>

                  {gameStatus === '준비중' && (
                    <button
                      onClick={() => handleRemove(idx + 1, lineup.member)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      ❌
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
