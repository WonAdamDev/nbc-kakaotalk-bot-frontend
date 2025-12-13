import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function RoomPage() {
  const { roomId } = useParams()
  const [room, setRoom] = useState(null)
  const [games, setGames] = useState([])
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

  // 방 정보 및 경기 목록 로드
  const loadRoomData = async (page = 1) => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/api/room/${roomId}/games`, {
        params: { page, limit: 10 }
      })

      if (response.data.success) {
        setRoom(response.data.data.room)
        setGames(response.data.data.games)
        setPagination(response.data.data.pagination)
        setError(null)
      }
    } catch (err) {
      console.error('Failed to load room data:', err)
      if (err.response?.status === 404) {
        setError('방을 찾을 수 없습니다.')
      } else {
        setError('데이터를 불러오는데 실패했습니다.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (roomId) {
      loadRoomData()
    }
  }, [roomId])

  const handlePageChange = (newPage) => {
    loadRoomData(newPage)
  }

  if (loading && !room) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="card bg-red-50 border-red-200">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{room?.name}</h1>
        <p className="text-gray-600">방 ID: {roomId}</p>
      </div>

      {/* 경기 목록 */}
      {games.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 text-lg">아직 생성된 경기가 없습니다.</p>
          <p className="text-gray-400 text-sm mt-2">카카오톡 봇을 통해 경기를 생성해보세요.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {games.map((game) => (
              <Link
                key={game.game_id}
                to={`/game/${game.game_id}`}
                className="card hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`badge ${
                    game.status === '종료' ? 'badge-secondary' :
                    game.status === '진행중' ? 'badge-success' : 'badge-primary'
                  }`}>
                    {game.status}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(game.date).toLocaleDateString('ko-KR')}
                  </span>
                </div>

                <h3 className="text-lg font-semibold mb-2">
                  경기 {game.game_id}
                </h3>

                {game.team_home && game.team_away && (
                  <p className="text-sm text-gray-600 mb-2">
                    {game.team_home} vs {game.team_away}
                  </p>
                )}

                {game.final_score && (
                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <span className="text-sm font-medium">
                      최종 점수
                    </span>
                    <span className="text-sm font-bold">
                      {game.final_score.blue} : {game.final_score.white}
                    </span>
                  </div>
                )}

                {game.current_quarter > 0 && game.status !== '종료' && (
                  <div className="mt-3 pt-3 border-t">
                    <span className="text-sm text-gray-600">
                      {game.current_quarter}쿼터 진행중
                    </span>
                  </div>
                )}
              </Link>
            ))}
          </div>

          {/* 페이지네이션 */}
          {pagination.total_pages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={!pagination.has_prev || loading}
                className="btn btn-secondary"
              >
                ← 이전
              </button>

              <span className="text-gray-600">
                {pagination.page} / {pagination.total_pages}
              </span>

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.has_next || loading}
                className="btn btn-secondary"
              >
                다음 →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
