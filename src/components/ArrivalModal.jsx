import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function ArrivalModal({ isOpen, onClose, onArrival, roomName }) {
  const [selectedTeam, setSelectedTeam] = useState('블루')
  const [memberName, setMemberName] = useState('')
  const [loading, setLoading] = useState(false)
  const [members, setMembers] = useState([])
  const [loadingMembers, setLoadingMembers] = useState(false)

  // 멤버 프리셋 로드
  useEffect(() => {
    if (isOpen && roomName) {
      loadMembers()
    }
  }, [isOpen, roomName])

  const loadMembers = async () => {
    if (!roomName) return

    try {
      setLoadingMembers(true)
      const response = await axios.get(`${API_URL}/api/commands/member/list`, {
        params: { room: roomName }
      })
      if (response.data.success) {
        setMembers(response.data.data.members || [])
      }
    } catch (err) {
      console.error('Failed to load members:', err)
    } finally {
      setLoadingMembers(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!memberName.trim()) return

    try {
      setLoading(true)
      await onArrival(selectedTeam, memberName.trim())
      // 성공 시 초기화
      setMemberName('')
      onClose()
    } catch (err) {
      alert('도착 처리 실패: ' + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }

  const handleSelectMember = (name) => {
    setMemberName(name)
  }

  // 팀별로 그룹화된 멤버 목록
  const groupedMembers = useMemo(() => {
    const groups = {}
    const noTeam = []

    members.forEach((member) => {
      if (member.team) {
        if (!groups[member.team]) {
          groups[member.team] = []
        }
        groups[member.team].push(member)
      } else {
        noTeam.push(member)
      }
    })

    // 각 팀 내에서 이름순 정렬
    Object.keys(groups).forEach((team) => {
      groups[team].sort((a, b) => a.name.localeCompare(b.name))
    })
    noTeam.sort((a, b) => a.name.localeCompare(b.name))

    // 팀 이름 정렬
    const sortedTeams = Object.keys(groups).sort()

    return { teams: sortedTeams, groups, noTeam }
  }, [members])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">선수 출석 처리</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mb-6">
          <div className="space-y-4">
            {/* 팀 선택 */}
            <div>
              <label className="block text-sm font-medium mb-2">팀 선택</label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="input w-full"
              >
                <option value="블루">HOME</option>
                <option value="화이트">AWAY</option>
              </select>
            </div>

            {/* 선수 이름 입력 */}
            <div>
              <label className="block text-sm font-medium mb-2">선수 이름</label>
              <input
                type="text"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                placeholder="선수 이름을 입력하세요"
                className="input w-full"
                autoFocus
              />
            </div>

            {/* 출석 처리 버튼 */}
            <button
              type="submit"
              disabled={loading || !memberName.trim()}
              className="btn btn-primary w-full"
            >
              ✅ 출석 처리
            </button>
          </div>
        </form>

        {/* 프리셋 멤버 리스트 (팀별 칼럼) */}
        <div>
          <h3 className="font-semibold mb-3 text-gray-700">프리셋 멤버</h3>

          {loadingMembers ? (
            <div className="text-center py-8 text-gray-500">
              로딩 중...
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              등록된 멤버가 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto">
              {/* 팀별 멤버 칼럼 */}
              {groupedMembers.teams.map((teamName) => (
                <div key={teamName} className="bg-blue-50 rounded-lg border border-blue-200 p-3 flex flex-col">
                  {/* 팀 헤더 */}
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-blue-300">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <h4 className="font-bold text-gray-800 text-sm">{teamName}</h4>
                    <span className="text-xs text-gray-600 bg-blue-200 px-1.5 py-0.5 rounded-full ml-auto">
                      {groupedMembers.groups[teamName].length}
                    </span>
                  </div>
                  {/* 팀 멤버 목록 */}
                  <div className="space-y-1">
                    {groupedMembers.groups[teamName].map((member) => (
                      <button
                        key={member.name}
                        onClick={() => handleSelectMember(member.name)}
                        className={`
                          w-full p-2 rounded transition-all text-left text-sm
                          ${memberName === member.name
                            ? 'bg-blue-500 text-white font-semibold'
                            : 'bg-white text-gray-900 hover:bg-blue-100 border border-blue-100 hover:border-blue-300'
                          }
                        `}
                      >
                        {member.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* 팀 미배정 멤버 칼럼 */}
              {groupedMembers.noTeam.length > 0 && (
                <div className="bg-gray-50 rounded-lg border border-gray-300 p-3 flex flex-col">
                  {/* 미배정 헤더 */}
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-300">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <h4 className="font-bold text-gray-800 text-sm">팀 미배정</h4>
                    <span className="text-xs text-gray-600 bg-gray-200 px-1.5 py-0.5 rounded-full ml-auto">
                      {groupedMembers.noTeam.length}
                    </span>
                  </div>
                  {/* 미배정 멤버 목록 */}
                  <div className="space-y-1">
                    {groupedMembers.noTeam.map((member) => (
                      <button
                        key={member.name}
                        onClick={() => handleSelectMember(member.name)}
                        className={`
                          w-full p-2 rounded transition-all text-left text-sm
                          ${memberName === member.name
                            ? 'bg-gray-600 text-white font-semibold'
                            : 'bg-white text-gray-900 hover:bg-gray-100 border border-gray-200 hover:border-gray-400'
                          }
                        `}
                      >
                        {member.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
