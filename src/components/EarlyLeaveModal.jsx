import { useState } from 'react'

export default function EarlyLeaveModal({ isOpen, onClose, lineups, onSelectPlayer, gameStatus }) {
  const [selectedTeam, setSelectedTeam] = useState('블루')

  if (!isOpen) return null

  const currentLineups = lineups[selectedTeam] || []

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">조퇴 선수 선택</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            &times;
          </button>
        </div>

        {/* 팀 선택 탭 */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setSelectedTeam('블루')}
            className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
              selectedTeam === '블루'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            HOME ({lineups.블루?.length || 0}명)
          </button>
          <button
            onClick={() => setSelectedTeam('화이트')}
            className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
              selectedTeam === '화이트'
                ? 'bg-gray-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            AWAY ({lineups.화이트?.length || 0}명)
          </button>
        </div>

        {/* 선수 목록 */}
        <div className="space-y-2">
          {currentLineups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              도착한 선수가 없습니다.
            </div>
          ) : (
            currentLineups.map((lineup) => (
              <div
                key={lineup.id}
                className={`
                  flex items-center justify-between p-3 rounded-lg border cursor-pointer
                  transition-all hover:shadow-md
                  ${selectedTeam === '블루' ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' : 'bg-gray-50 border-gray-300 hover:bg-gray-100'}
                `}
                onClick={() => {
                  const action = gameStatus === '준비중' ? '제거' : '조퇴 처리'
                  if (confirm(`${lineup.member}님을 ${action}하시겠습니까?`)) {
                    onSelectPlayer(lineup.id, lineup.member)
                  }
                }}
              >
                <div className="flex items-center gap-4">
                  <div className={`
                    flex items-center justify-center w-12 h-12 rounded-lg font-bold text-lg text-white
                    ${selectedTeam === '블루' ? 'bg-blue-600' : 'bg-gray-600'}
                  `}>
                    {lineup.number}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-lg">{lineup.member}</p>
                    <p className="text-xs text-gray-500">
                      도착: {new Date(lineup.arrived_at).toLocaleTimeString('ko-KR')}
                    </p>
                  </div>
                </div>
                <button
                  className="text-red-600 hover:text-red-800 px-3 py-1 rounded"
                  title={gameStatus === '준비중' ? '제거' : '조퇴 처리'}
                >
                  {gameStatus === '준비중' ? '❌ 제거' : '👋 조퇴'}
                </button>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="btn btn-secondary"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
