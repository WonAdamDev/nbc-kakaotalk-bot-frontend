import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function RoomMemberModal({ isOpen, onClose, gameId, onSelectMember }) {
  const [members, setMembers] = useState([])
  const [newMemberName, setNewMemberName] = useState('')
  const [loading, setLoading] = useState(false)
  const [roomName, setRoomName] = useState('')

  // 멤버 목록 로드
  const loadMembers = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/api/game/${gameId}/room/members`)
      if (response.data.success) {
        setMembers(response.data.data.members)
        setRoomName(response.data.data.room)
      }
    } catch (err) {
      console.error('Failed to load members:', err)
      alert('멤버 목록을 불러올 수 없습니다: ' + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && gameId) {
      loadMembers()
    }
  }, [isOpen, gameId])

  // 멤버 추가
  const handleAddMember = async (e) => {
    e.preventDefault()
    if (!newMemberName.trim()) return

    try {
      setLoading(true)
      const response = await axios.post(`${API_URL}/api/game/${gameId}/room/members`, {
        name: newMemberName.trim()
      })

      if (response.data.success) {
        setMembers([...members, response.data.data])
        setNewMemberName('')
      }
    } catch (err) {
      alert('멤버 추가 실패: ' + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }

  // 멤버 삭제
  const handleDeleteMember = async (memberId, memberName) => {
    if (!confirm(`${memberName}님을 프리셋에서 삭제하시겠습니까?`)) return

    try {
      setLoading(true)
      await axios.delete(`${API_URL}/api/game/${gameId}/room/members/${memberId}`)
      setMembers(members.filter(m => m.id !== memberId))
    } catch (err) {
      alert('멤버 삭제 실패: ' + (err.response?.data?.error || err.message))
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
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <button
                    onClick={() => handleSelectMember(member.name)}
                    className="flex-1 text-left font-medium text-gray-900 hover:text-blue-600"
                  >
                    {member.name}
                  </button>
                  <button
                    onClick={() => handleDeleteMember(member.id, member.name)}
                    className="text-red-600 hover:text-red-800 text-sm px-2"
                  >
                    ❌
                  </button>
                </div>
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
