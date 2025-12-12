import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function RoomMemberModal({ isOpen, onClose, roomName, onSelectMember }) {
  const [members, setMembers] = useState([])
  const [newMemberName, setNewMemberName] = useState('')
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

  // 멤버 추가
  const handleAddMember = async (e) => {
    e.preventDefault()
    if (!newMemberName.trim() || !roomName) return

    try {
      setLoading(true)
      const response = await axios.post(`${API_URL}/api/commands/member`, {
        room: roomName,
        member: newMemberName.trim()
      })

      if (response.data.success) {
        // 목록 새로고침
        await loadMembers()
        setNewMemberName('')
      }
    } catch (err) {
      alert('멤버 추가 실패: ' + (err.response?.data?.message || err.message))
    } finally {
      setLoading(false)
    }
  }

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
      <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
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
        <div className="p-4">
          <p className="text-sm text-gray-600 mb-4">
            자주 사용하는 멤버를 추가하고 선수 도착 처리 시 빠르게 선택하세요.
          </p>

          {/* 멤버 추가 폼 */}
          <form onSubmit={handleAddMember} className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                placeholder="멤버 이름"
                className="input flex-1"
              />
              <button
                type="submit"
                disabled={loading || !newMemberName.trim()}
                className="btn btn-primary"
              >
                추가
              </button>
            </div>
          </form>

          {/* 멤버 목록 (팀별 그룹화) */}
          <div className="space-y-4">
            {loading ? (
              <p className="text-center text-gray-500 py-4">로딩 중...</p>
            ) : members.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                등록된 멤버가 없습니다. 멤버를 추가해보세요.
              </p>
            ) : (
              <>
                {/* 팀별 멤버 표시 */}
                {groupedMembers.teams.map((teamName) => (
                  <div key={teamName}>
                    {/* 팀 헤더 */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <h3 className="font-semibold text-gray-700">{teamName}</h3>
                      <span className="text-xs text-gray-500">
                        {groupedMembers.groups[teamName].length}명
                      </span>
                    </div>
                    {/* 팀 멤버 목록 */}
                    <div className="space-y-1 ml-5 mb-3">
                      {groupedMembers.groups[teamName].map((member) => (
                        <button
                          key={member.name}
                          onClick={() => handleSelectMember(member.name)}
                          className="w-full p-2.5 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left text-gray-900 hover:text-blue-600 border border-blue-200"
                        >
                          {member.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {/* 팀 미배정 멤버 */}
                {groupedMembers.noTeam.length > 0 && (
                  <div>
                    {/* 미배정 헤더 */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                      <h3 className="font-semibold text-gray-700">팀 미배정</h3>
                      <span className="text-xs text-gray-500">
                        {groupedMembers.noTeam.length}명
                      </span>
                    </div>
                    {/* 미배정 멤버 목록 */}
                    <div className="space-y-1 ml-5">
                      {groupedMembers.noTeam.map((member) => (
                        <button
                          key={member.name}
                          onClick={() => handleSelectMember(member.name)}
                          className="w-full p-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left text-gray-900 hover:text-gray-600 border border-gray-200"
                        >
                          {member.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
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
