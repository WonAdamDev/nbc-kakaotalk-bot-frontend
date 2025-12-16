import { useNavigate } from 'react-router-dom'
import { formatDateTimeKST } from '../utils/timeUtils'

export default function GameHeader({ game }) {
  const navigate = useNavigate()
  const getStatusBadge = (status) => {
    const badges = {
      '준비중': 'badge badge-warning',
      '진행중': 'badge badge-success',
      '종료': 'badge badge-danger'
    }
    return badges[status] || 'badge'
  }

  return (
    <div className="card mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {game.room}
          </h1>
          <p className="text-gray-600">
            경기 ID: <span className="font-mono font-semibold">{game.game_id}</span>
          </p>
          {game.parent_game_id && (
            <button
              onClick={() => navigate(`/game/${game.parent_game_id}`)}
              className="mt-2 px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors"
            >
              ← 원본 경기 보기
            </button>
          )}
        </div>
        <div className="text-right">
          <span className={getStatusBadge(game.status)}>
            {game.status}
          </span>
          {game.status === '진행중' && (
            <p className="text-sm text-gray-600 mt-2">
              현재 쿼터: {game.current_quarter}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-gray-500">생성자</p>
          <p className="font-semibold">{game.creator || '-'}</p>
        </div>
        <div>
          <p className="text-gray-500">날짜</p>
          <p className="font-semibold">{game.date}</p>
        </div>
        <div>
          <p className="text-gray-500">생성 시각</p>
          <p className="font-semibold text-xs">
            {formatDateTimeKST(game.created_at)}
          </p>
        </div>
        {game.started_at && (
          <div>
            <p className="text-gray-500">시작 시각</p>
            <p className="font-semibold text-xs">
              {formatDateTimeKST(game.started_at)}
            </p>
          </div>
        )}
      </div>

      {/* 팀 정보 표시 */}
      {(game.team_home || game.team_away) && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">HOME</p>
              <p className="font-bold text-blue-700 text-lg">
                {game.team_home || '팀 미지정'}
              </p>
            </div>
            <div className="bg-gray-50 border border-gray-300 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">AWAY</p>
              <p className="font-bold text-gray-700 text-lg">
                {game.team_away || '팀 미지정'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
