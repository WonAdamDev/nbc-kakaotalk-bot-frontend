import { useState, useEffect } from 'react'
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

          {/* 멤버 목록 */}
          <div className="space-y-2">
            {loading ? (
              <p className="text-center text-gray-500 py-4">로딩 중...</p>
            ) : members.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                등록된 멤버가 없습니다. 멤버를 추가해보세요.
              </p>
            ) : (
              members.map((member) => (
                <button
                  key={member.name}
                  onClick={() => handleSelectMember(member.name)}
                  className="w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left font-medium text-gray-900 hover:text-blue-600"
                >
                  {member.name}
                </button>
              ))
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
