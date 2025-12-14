import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function GameList() {
  const navigate = useNavigate()
  const [games, setGames] = useState([])
  const [rooms, setRooms] = useState([])
  const [selectedRoom, setSelectedRoom] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total_items: 0,
    total_pages: 0,
    has_next: false,
    has_prev: false
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 방 목록 로드
  const loadRooms = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/game/rooms`)
      if (response.data.success) {
        setRooms(response.data.data.rooms)
      }
    } catch (err) {
      console.error('Failed to load rooms:', err)
    }
  }

  // 경기 목록 로드
  const loadGames = async (page = 1, room = '') => {
    try {
      setLoading(true)
      const params = {
        page,
        limit: 10
      }

      // room 파라미터가 있으면 추가
      if (room) {
        params.room = room
      }

      const response = await axios.get(`${API_URL}/api/game/all`, { params })

      if (response.data.success) {
        setGames(response.data.data.games)
        setPagination(response.data.data.pagination)
        setError(null)
      }
    } catch (err) {
      console.error('Failed to load games:', err)
      setError('경기 목록을 불러올 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRooms()
    loadGames(1)
  }, [])

  // 페이지 변경 핸들러
  const handlePageChange = (newPage) => {
    loadGames(newPage, selectedRoom)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 방 필터 변경 핸들러
  const handleRoomChange = (room) => {
    setSelectedRoom(room)
    loadGames(1, room)
  }

  // 상태 배지 스타일
  const getStatusBadge = (status) => {
    const styles = {
      '준비중': 'bg-gray-500',
      '진행중': 'bg-blue-500',
      '종료': 'bg-green-500'
    }
    return styles[status] || 'bg-gray-500'
  }

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // 시간 포맷팅
  const formatTime = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleTimeString('ko-KR', {
      timeZone: 'Asia/Seoul',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading && games.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">로딩 중...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-500 text-xl">{error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-white">경기 목록</h1>
            <button
              onClick={() => navigate('/admin/login')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              🔐 Admin
            </button>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-gray-400">
              전체 {pagination.total_items}개의 경기
            </p>

            {/* 방 필터링 드롭다운 */}
            <div className="flex items-center gap-2">
              <label className="text-gray-400 text-sm">방:</label>
              <select
                value={selectedRoom}
                onChange={(e) => handleRoomChange(e.target.value)}
                className="bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="">전체</option>
                {rooms.map((room) => (
                  <option key={room} value={room}>
                    {room}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 경기 목록 */}
        {games.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-400 text-lg">등록된 경기가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {games.map((game) => (
              <Link
                key={game.game_id}
                to={`/game/${game.game_id}`}
                className="block bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors border-2 border-transparent hover:border-blue-500"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* 경기 ID와 상태 */}
                    <div className="flex items-center gap-3 mb-3">
                      <h2 className="text-xl font-bold text-white">
                        {game.game_id}
                      </h2>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${getStatusBadge(
                          game.status
                        )}`}
                      >
                        {game.status}
                      </span>
                    </div>

                    {/* 경기 정보 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">방:</span>{' '}
                        <span className="text-white font-medium">
                          {game.room || '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">생성자:</span>{' '}
                        <span className="text-white font-medium">
                          {game.creator || '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">경기일:</span>{' '}
                        <span className="text-white font-medium">
                          {formatDate(game.date)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">생성 시간:</span>{' '}
                        <span className="text-white font-medium">
                          {formatTime(game.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* 경기 진행 정보 */}
                    {game.status !== '준비중' && (
                      <div className="mt-3 text-sm">
                        <span className="text-gray-400">쿼터:</span>{' '}
                        <span className="text-white font-medium">
                          {game.current_quarter}쿼터
                        </span>
                      </div>
                    )}

                    {/* 최종 점수 (종료된 경기) */}
                    {game.status === '종료' && (
                      <div className="mt-3 flex items-center gap-4">
                        <div className="text-sm">
                          <span className="text-blue-400 font-semibold">
                            {game.team_home || 'HOME'} {game.final_score_home || 0}
                          </span>
                          {' : '}
                          <span className="text-white font-semibold">
                            {game.team_away || 'AWAY'} {game.final_score_away || 0}
                          </span>
                        </div>
                        {game.winner && (
                          <div className="text-sm">
                            <span className="text-yellow-400 font-semibold">
                              🏆 {game.winner}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 화살표 아이콘 */}
                  <div className="text-gray-400 ml-4">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* 페이지네이션 */}
        {pagination.total_pages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.has_prev}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                pagination.has_prev
                  ? 'bg-gray-800 text-white hover:bg-gray-700'
                  : 'bg-gray-800 text-gray-600 cursor-not-allowed'
              }`}
            >
              이전
            </button>

            <div className="flex items-center gap-2">
              {[...Array(pagination.total_pages)].map((_, i) => {
                const page = i + 1
                // 현재 페이지 근처만 표시
                if (
                  page === 1 ||
                  page === pagination.total_pages ||
                  (page >= pagination.page - 2 && page <= pagination.page + 2)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                        page === pagination.page
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-800 text-white hover:bg-gray-700'
                      }`}
                    >
                      {page}
                    </button>
                  )
                } else if (
                  page === pagination.page - 3 ||
                  page === pagination.page + 3
                ) {
                  return (
                    <span key={page} className="text-gray-400">
                      ...
                    </span>
                  )
                }
                return null
              })}
            </div>

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.has_next}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                pagination.has_next
                  ? 'bg-gray-800 text-white hover:bg-gray-700'
                  : 'bg-gray-800 text-gray-600 cursor-not-allowed'
              }`}
            >
              다음
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
