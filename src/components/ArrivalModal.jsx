import { useState, useEffect } from 'react'
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

        {/* 프리셋 멤버 리스트 */}
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
              {members.map((member) => (
                <button
                  key={member.name}
                  onClick={() => handleSelectMember(member.name)}
                  className={`
                    p-3 rounded-lg border transition-all text-left
                    ${memberName === member.name
                      ? 'bg-blue-100 border-blue-500 font-semibold'
                      : 'bg-gray-50 border-gray-300 hover:bg-gray-100 hover:border-gray-400'
                    }
                  `}
                >
                  <div className="font-medium">{member.name}</div>
                  {member.team && (
                    <div className="text-xs text-gray-500 mt-1">팀: {member.team}</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
