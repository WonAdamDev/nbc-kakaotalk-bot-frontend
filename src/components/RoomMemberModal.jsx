import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function RoomMemberModal({ isOpen, onClose, roomName, onSelectMember }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(false)

  // 멤버 목록 로드
  const loadMembers = async () => {
    if (!roomName) return

    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/api/commands/member/list`, {
        params: { room: roomName }
      })
      if (response.data.success) {
        setMembers(response.data.data.members)
      }
    } catch (err) {
      console.error('Failed to load members:', err)
      alert('멤버 목록을 불러올 수 없습니다: ' + (err.response?.data?.message || err.message))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && roomName) {
      loadMembers()
    }
  }, [isOpen, roomName])

  // 멤버 선택
  const handleSelectMember = (memberName) => {
    onSelectMember(memberName)
    onClose()
  }

  // 팀별로 그룹화된 멤버 목록 (useMemo로 최적화)
  const groupedMembers = useMemo(() => {
    const groups = {}
    const noTeam = []

    members.forEach((member) => {
      if (member.team) {
        // 팀이 있는 경우
        if (!groups[member.team]) {
          groups[member.team] = []
        }
        groups[member.team].push(member)
      } else {
        // 팀이 없는 경우
        noTeam.push(member)
      }
    })

    // 각 팀 내에서 이름순 정렬
    Object.keys(groups).forEach((team) => {
      groups[team].sort((a, b) => a.name.localeCompare(b.name))
    })
    noTeam.sort((a, b) => a.name.localeCompare(b.name))

    // 팀 이름 정렬 (알파벳순)
    const sortedTeams = Object.keys(groups).sort()

    return { teams: sortedTeams, groups, noTeam }
  }, [members])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[85vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between rounded-t-lg">
          <h2 className="text-xl font-bold">
            방 멤버 프리셋 {roomName && `(${roomName})`}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-sm text-gray-600 mb-4">
            등록된 멤버를 선택하여 선수 도착 처리를 빠르게 하세요.
          </p>

          {/* 멤버 목록 (팀별 칼럼 그리드) */}
          <div>
            {loading ? (
              <p className="text-center text-gray-500 py-4">로딩 중...</p>
            ) : members.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                등록된 멤버가 없습니다. 멤버를 추가해보세요.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {/* 팀별 멤버 칼럼 */}
                {groupedMembers.teams.map((teamName) => (
                  <div key={teamName} className="bg-blue-50 rounded-lg border border-blue-200 p-3 flex flex-col min-h-[200px]">
                    {/* 팀 헤더 */}
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-blue-300">
                      <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                      <h3 className="font-bold text-gray-800 text-sm">{teamName}</h3>
                      <span className="text-xs text-gray-600 bg-blue-200 px-2 py-0.5 rounded-full ml-auto">
                        {groupedMembers.groups[teamName].length}명
                      </span>
                    </div>
                    {/* 팀 멤버 목록 */}
                    <div className="space-y-1.5 flex-1 overflow-y-auto">
                      {groupedMembers.groups[teamName].map((member) => (
                        <button
                          key={member.name}
                          onClick={() => handleSelectMember(member.name)}
                          className="w-full p-2 bg-white rounded hover:bg-blue-100 transition-colors text-left text-sm text-gray-900 hover:text-blue-600 border border-blue-100 hover:border-blue-300"
                        >
                          {member.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {/* 팀 미배정 멤버 칼럼 */}
                {groupedMembers.noTeam.length > 0 && (
                  <div className="bg-gray-50 rounded-lg border border-gray-300 p-3 flex flex-col min-h-[200px]">
                    {/* 미배정 헤더 */}
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-300">
                      <div className="w-3 h-3 bg-gray-400 rounded-full flex-shrink-0"></div>
                      <h3 className="font-bold text-gray-800 text-sm">팀 미배정</h3>
                      <span className="text-xs text-gray-600 bg-gray-200 px-2 py-0.5 rounded-full ml-auto">
                        {groupedMembers.noTeam.length}명
                      </span>
                    </div>
                    {/* 미배정 멤버 목록 */}
                    <div className="space-y-1.5 flex-1 overflow-y-auto">
                      {groupedMembers.noTeam.map((member) => (
                        <button
                          key={member.name}
                          onClick={() => handleSelectMember(member.name)}
                          className="w-full p-2 bg-white rounded hover:bg-gray-100 transition-colors text-left text-sm text-gray-900 hover:text-gray-600 border border-gray-200 hover:border-gray-400"
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

        {/* 푸터 */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4">
          <button
            onClick={onClose}
            className="w-full btn btn-secondary"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
