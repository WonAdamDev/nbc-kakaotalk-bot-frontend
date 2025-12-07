export default function ScoreBoard({ game, quarters }) {
  // 각 팀의 총 점수 계산
  const totalScoreBlue = quarters.reduce((sum, q) => sum + (q.score?.blue || 0), 0)
  const totalScoreWhite = quarters.reduce((sum, q) => sum + (q.score?.white || 0), 0)

  return (
    <div className="card mb-6">
      <h2 className="text-xl font-bold mb-4">스코어보드</h2>

      {/* 총점 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-6 text-center border-2 border-blue-200">
          <p className="text-sm text-blue-600 font-semibold mb-2">블루팀</p>
          <p className="text-5xl font-bold text-blue-700">{totalScoreBlue}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-6 text-center border-2 border-gray-300">
          <p className="text-sm text-gray-600 font-semibold mb-2">화이트팀</p>
          <p className="text-5xl font-bold text-gray-700">{totalScoreWhite}</p>
        </div>
      </div>

      {/* 쿼터별 점수 */}
      {quarters.length > 0 && (
        <div>
          <p className="text-sm text-gray-600 font-semibold mb-2">쿼터별 점수</p>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    쿼터
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                    블루
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                    화이트
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    상태
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {quarters.map((quarter) => (
                  <tr key={quarter.quarter}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      Q{quarter.quarter}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-blue-700 font-semibold">
                      {quarter.score?.blue || 0}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-700 font-semibold">
                      {quarter.score?.white || 0}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`badge ${
                        quarter.status === '진행중' ? 'badge-success' : 'badge-secondary'
                      }`}>
                        {quarter.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 최종 결과 (경기 종료 시) */}
      {game.status === '종료' && game.winner && (
        <div className="mt-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg text-center">
          <p className="text-lg font-bold text-yellow-900">
            🏆 승자: {game.winner}
          </p>
          <p className="text-sm text-yellow-700 mt-1">
            최종 점수 - 블루: {game.final_score?.blue}, 화이트: {game.final_score?.white}
          </p>
        </div>
      )}
    </div>
  )
}
