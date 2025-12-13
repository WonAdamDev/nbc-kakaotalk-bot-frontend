import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function ArrivalModal({ isOpen, onClose, onArrival, roomName, lineups }) {
  const [mode, setMode] = useState('preset') // 'preset' 또는 'guest'
  const [selectedTeam, setSelectedTeam] = useState('home')
  const [selectedMembers, setSelectedMembers] = useState([]) // [{name, member_id, team_id}]
  const [guestName, setGuestName] = useState('')
  const [guestList, setGuestList] = useState([]) // 추가된 게스트 목록
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
      setSelectedMembers([])
      setGuestName('')
      setGuestList([])
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
    if (selectedMembers.length === 0) return

    try {
      setLoading(true)
      // 선택된 모든 멤버 추가
      for (const member of selectedMembers) {
        await onArrival(selectedTeam, member.name, member.member_id, member.team_id)
      }
      setSelectedMembers([])
      onClose()
    } catch (err) {
      // 에러는 상위에서 처리
    } finally {
      setLoading(false)
    }
  }

  const toggleMemberSelection = (member) => {
    const isSelected = selectedMembers.some(m => m.member_id === member.member_id)
    if (isSelected) {
      setSelectedMembers(selectedMembers.filter(m => m.member_id !== member.member_id))
    } else {
      setSelectedMembers([...selectedMembers, {
        name: member.name,
        member_id: member.member_id,
        team_id: member.team_id
      }])
    }
  }

  // 멤버가 이미 라인업에 있는지 확인
  const isMemberInLineup = (memberId) => {
    if (!lineups) return false
    const allLineups = [...(lineups?.home || []), ...(lineups?.away || [])]
    return allLineups.some(lineup => lineup.member_id === memberId)
  }

  const handleAddGuest = (e) => {
    e.preventDefault()
    const trimmedName = guestName.trim()
    if (!trimmedName) return

    // 중복 체크
    if (guestList.includes(trimmedName)) {
      alert('이미 추가된 게스트입니다.')
      return
    }

    setGuestList([...guestList, trimmedName])
    setGuestName('')
  }

  const handleRemoveGuest = (name) => {
    setGuestList(guestList.filter(g => g !== name))
  }

  const handleGuestSubmit = async (e) => {
    e.preventDefault()
    if (guestList.length === 0) return

    try {
      setLoading(true)
      // 모든 게스트 추가
      for (const name of guestList) {
        await onArrival(selectedTeam, name)
      }
      setGuestList([])
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
            <option value="home">HOME</option>
            <option value="away">AWAY</option>
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
                  ✨ 여러 멤버를 선택할 수 있습니다. 선택 후 출석 처리 버튼을 누르세요.
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
                        {groupedMembers.groups[teamName].map((member) => {
                          const isSelected = selectedMembers.some(m => m.member_id === member.member_id)
                          const isInLineup = isMemberInLineup(member.member_id)
                          return (
                            <button
                              key={member.member_id || member.name}
                              onClick={() => !isInLineup && toggleMemberSelection(member)}
                              disabled={isInLineup}
                              className={`
                                w-full p-2 rounded transition-all text-left text-sm
                                ${isInLineup
                                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed opacity-60'
                                  : isSelected
                                    ? 'bg-blue-500 text-white font-semibold'
                                    : 'bg-white text-gray-900 hover:bg-blue-100 border border-blue-100 hover:border-blue-300'
                                }
                              `}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span>{member.name}</span>
                                  {isInLineup && (
                                    <span className="text-xs bg-gray-400 text-white px-1.5 py-0.5 rounded">
                                      이미 출석
                                    </span>
                                  )}
                                </div>
                                {member.member_id && (
                                  <span className="text-xs opacity-70">
                                    #{member.member_id.slice(-4)}
                                  </span>
                                )}
                              </div>
                            </button>
                          )
                        })}
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
                        {groupedMembers.noTeam.map((member) => {
                          const isSelected = selectedMembers.some(m => m.member_id === member.member_id)
                          const isInLineup = isMemberInLineup(member.member_id)
                          return (
                            <button
                              key={member.member_id || member.name}
                              onClick={() => !isInLineup && toggleMemberSelection({
                                name: member.name,
                                member_id: member.member_id,
                                team_id: null
                              })}
                              disabled={isInLineup}
                              className={`
                                w-full p-2 rounded transition-all text-left text-sm
                                ${isInLineup
                                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed opacity-60'
                                  : isSelected
                                    ? 'bg-gray-600 text-white font-semibold'
                                    : 'bg-white text-gray-900 hover:bg-gray-100 border border-gray-200 hover:border-gray-400'
                                }
                              `}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span>{member.name}</span>
                                  {isInLineup && (
                                    <span className="text-xs bg-gray-400 text-white px-1.5 py-0.5 rounded">
                                      이미 출석
                                    </span>
                                  )}
                                </div>
                                {member.member_id && (
                                  <span className="text-xs opacity-70">
                                    #{member.member_id.slice(-4)}
                                  </span>
                                )}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handlePresetSubmit}
                  disabled={loading || selectedMembers.length === 0}
                  className="btn btn-primary w-full"
                >
                  ✅ 출석 처리 {selectedMembers.length > 0 && `(${selectedMembers.length}명)`}
                </button>
              </>
            )}
          </div>
        )}

        {/* 게스트 모드 */}
        {mode === 'guest' && (
          <div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-orange-800">
                ⚠️ <strong>게스트로 추가</strong> - 임시 ID가 발급되어 이번 경기에서만 사용됩니다
              </p>
            </div>

            {/* 게스트 추가 입력 */}
            <form onSubmit={handleAddGuest} className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="게스트 이름 입력"
                  className="input flex-1"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!guestName.trim()}
                  className="btn bg-blue-500 hover:bg-blue-600 text-white px-6"
                >
                  추가
                </button>
              </div>
            </form>

            {/* 추가된 게스트 목록 */}
            {guestList.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  추가된 게스트 ({guestList.length}명)
                </label>
                <div className="border border-gray-300 rounded-lg p-3 max-h-[200px] overflow-y-auto">
                  <div className="space-y-2">
                    {guestList.map((name, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded p-2"
                      >
                        <span className="text-sm font-medium">{name}</span>
                        <button
                          onClick={() => handleRemoveGuest(name)}
                          className="text-red-500 hover:text-red-700 text-xl"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 확정 버튼 */}
            <button
              onClick={handleGuestSubmit}
              disabled={loading || guestList.length === 0}
              className="btn btn-danger w-full bg-orange-500 hover:bg-orange-600"
            >
              🎭 게스트로 추가 {guestList.length > 0 && `(${guestList.length}명)`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
