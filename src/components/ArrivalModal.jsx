import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function ArrivalModal({ isOpen, onClose, onArrival, roomName }) {
  const [mode, setMode] = useState('preset') // 'preset' 또는 'guest'
  const [selectedTeam, setSelectedTeam] = useState('블루')
  const [selectedMember, setSelectedMember] = useState(null) // {name, member_id, team_id}
  const [guestName, setGuestName] = useState('')
  const [loading, setLoading] = useState(false)
  const [members, setMembers] = useState([])
  const [loadingMembers, setLoadingMembers] = useState(false)

  // 멤버 프리셋 로드
  useEffect(() => {
    if (isOpen && roomName) {
      loadMembers()
    }
  }, [isOpen, roomName])

  // 모달 열릴 때 초기화
  useEffect(() => {
    if (isOpen) {
      setMode('preset')
      setSelectedMember(null)
      setGuestName('')
    }
  }, [isOpen])

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

  const handlePresetSubmit = async () => {
    if (!selectedMember) return

    try {
      setLoading(true)
      // member_id와 team_id 함께 전송
      await onArrival(selectedTeam, selectedMember.name, selectedMember.member_id, selectedMember.team_id)
      setSelectedMember(null)
      onClose()
    } catch (err) {
      // 에러는 상위에서 처리
    } finally {
      setLoading(false)
    }
  }

  const handleGuestSubmit = async (e) => {
    e.preventDefault()
    if (!guestName.trim()) return

    try {
      setLoading(true)
      // member_id 없이 이름만 전송 (게스트)
      await onArrival(selectedTeam, guestName.trim())
      setGuestName('')
      onClose()
    } catch (err) {
      // 에러는 상위에서 처리
    } finally {
      setLoading(false)
    }
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

    Object.keys(groups).forEach((team) => {
      groups[team].sort((a, b) => a.name.localeCompare(b.name))
    })
    noTeam.sort((a, b) => a.name.localeCompare(b.name))

    const sortedTeams = Object.keys(groups).sort()

    return { teams: sortedTeams, groups, noTeam }
  }, [members])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">선수 출석 처리</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            &times;
          </button>
        </div>

        {/* 모드 선택 탭 */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setMode('preset')}
            className={`px-4 py-2 font-semibold transition-all ${
              mode === 'preset'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            👤 방 멤버 추가
          </button>
          <button
            onClick={() => setMode('guest')}
            className={`px-4 py-2 font-semibold transition-all ${
              mode === 'guest'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            🎭 게스트 추가
          </button>
        </div>

        {/* 팀 선택 (공통) */}
        <div className="mb-4">
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

        {/* 방 멤버 모드 */}
        {mode === 'preset' && (
          <div>
            {loadingMembers ? (
              <div className="text-center py-12 text-gray-500">
                로딩 중...
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                등록된 멤버가 없습니다.
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-3">
                  ✨ 멤버를 선택하면 ID가 함께 저장되어 나중에 통계를 확인할 수 있습니다.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto mb-4">
                  {groupedMembers.teams.map((teamName) => (
                    <div key={teamName} className="bg-blue-50 rounded-lg border border-blue-200 p-3">
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-blue-300">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <h4 className="font-bold text-gray-800 text-sm">{teamName}</h4>
                        <span className="text-xs text-gray-600 bg-blue-200 px-1.5 py-0.5 rounded-full ml-auto">
                          {groupedMembers.groups[teamName].length}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {groupedMembers.groups[teamName].map((member) => (
                          <button
                            key={member.member_id || member.name}
                            onClick={() => setSelectedMember({
                              name: member.name,
                              member_id: member.member_id,
                              team_id: member.team_id
                            })}
                            className={`
                              w-full p-2 rounded transition-all text-left text-sm
                              ${selectedMember?.member_id === member.member_id
                                ? 'bg-blue-500 text-white font-semibold'
                                : 'bg-white text-gray-900 hover:bg-blue-100 border border-blue-100 hover:border-blue-300'
                              }
                            `}
                          >
                            <div className="flex items-center justify-between">
                              <span>{member.name}</span>
                              {member.member_id && (
                                <span className="text-xs opacity-70">
                                  #{member.member_id.slice(-4)}
                                </span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  {groupedMembers.noTeam.length > 0 && (
                    <div className="bg-gray-50 rounded-lg border border-gray-300 p-3">
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-300">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <h4 className="font-bold text-gray-800 text-sm">팀 미배정</h4>
                        <span className="text-xs text-gray-600 bg-gray-200 px-1.5 py-0.5 rounded-full ml-auto">
                          {groupedMembers.noTeam.length}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {groupedMembers.noTeam.map((member) => (
                          <button
                            key={member.member_id || member.name}
                            onClick={() => setSelectedMember({
                              name: member.name,
                              member_id: member.member_id,
                              team_id: null
                            })}
                            className={`
                              w-full p-2 rounded transition-all text-left text-sm
                              ${selectedMember?.member_id === member.member_id
                                ? 'bg-gray-600 text-white font-semibold'
                                : 'bg-white text-gray-900 hover:bg-gray-100 border border-gray-200 hover:border-gray-400'
                              }
                            `}
                          >
                            <div className="flex items-center justify-between">
                              <span>{member.name}</span>
                              {member.member_id && (
                                <span className="text-xs opacity-70">
                                  #{member.member_id.slice(-4)}
                                </span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handlePresetSubmit}
                  disabled={loading || !selectedMember}
                  className="btn btn-primary w-full"
                >
                  ✅ 출석 처리 {selectedMember && `(${selectedMember.name})`}
                </button>
              </>
            )}
          </div>
        )}

        {/* 게스트 모드 */}
        {mode === 'guest' && (
          <div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-orange-800 mb-2">
                ⚠️ <strong>게스트로 추가</strong>
              </p>
              <p className="text-xs text-orange-700">
                • 임시 ID가 발급되어 이번 경기에서만 사용됩니다<br />
                • 통계에서 제외됩니다
              </p>
            </div>

            <form onSubmit={handleGuestSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">게스트 이름</label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="게스트 이름을 입력하세요"
                  className="input w-full"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading || !guestName.trim()}
                className="btn btn-danger w-full bg-orange-500 hover:bg-orange-600"
              >
                🎭 게스트로 추가
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
