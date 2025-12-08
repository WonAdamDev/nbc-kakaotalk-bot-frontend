import { useState, useEffect } from 'react'

export default function QuarterStartModal({
  isOpen,
  onClose,
  preview,
  lineups,
  onConfirm
}) {
  const [playingBlue, setPlayingBlue] = useState([])
  const [benchBlue, setBenchBlue] = useState([])
  const [playingWhite, setPlayingWhite] = useState([])
  const [benchWhite, setBenchWhite] = useState([])
  const [isEditing, setIsEditing] = useState(false)

  // 미리보기 데이터로 초기화
  useEffect(() => {
    if (preview) {
      setPlayingBlue(preview.playing_blue || [])
      setBenchBlue(preview.bench_blue || [])
      setPlayingWhite(preview.playing_white || [])
      setBenchWhite(preview.bench_white || [])
      setIsEditing(false)
    }
  }, [preview])

  if (!isOpen || !preview) return null

  // 선수 번호로 이름 찾기
  const getMemberName = (team, number) => {
    const teamKey = team === 'blue' ? '블루' : '화이트'
    return preview.lineups?.[teamKey]?.[number] || `#${number}`
  }

  // 이대로 시작
  const handleStartAsIs = () => {
    onConfirm({
      playing_blue: playingBlue,
      bench_blue: benchBlue,
      playing_white: playingWhite,
      bench_white: benchWhite
    })
  }

  // 선수 이동 (드래그앤드롭 대신 버튼 방식)
  const movePlayer = (team, from, number) => {
    if (team === 'blue') {
      if (from === 'playing') {
        setPlayingBlue(prev => prev.filter(n => n !== number))
        setBenchBlue(prev => [...prev, number])
      } else {
        setBenchBlue(prev => prev.filter(n => n !== number))
        setPlayingBlue(prev => [...prev, number])
      }
    } else {
      if (from === 'playing') {
        setPlayingWhite(prev => prev.filter(n => n !== number))
        setBenchWhite(prev => [...prev, number])
      } else {
        setBenchWhite(prev => prev.filter(n => n !== number))
        setPlayingWhite(prev => [...prev, number])
      }
    }
  }

  const canConfirm = playingBlue.length === 5 && playingWhite.length === 5

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {preview.quarter_number}쿼터 시작
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* 본문 */}
        <div className="p-6">
          <p className="text-gray-600 mb-4">
            {isEditing
              ? '선수를 클릭하여 출전/벤치를 변경할 수 있습니다. (각 팀 출전 5명 필수)'
              : '자동 로테이션된 출전 명단입니다. 수정하시려면 "선수 변경" 버튼을 누르세요.'}
          </p>

          {/* 블루팀 */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-blue-600 mb-3">블루팀</h3>

            {/* 출전 */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-700">
                  출전 (코트) - {playingBlue.length}명
                </p>
                {playingBlue.length !== 5 && isEditing && (
                  <span className="text-xs text-red-500">5명 필요</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {playingBlue.map(num => (
                  <button
                    key={num}
                    onClick={() => isEditing && movePlayer('blue', 'playing', num)}
                    disabled={!isEditing}
                    className={`px-3 py-2 bg-blue-500 text-white rounded font-medium ${
                      isEditing ? 'hover:bg-blue-600 cursor-pointer' : ''
                    }`}
                  >
                    {num}. {getMemberName('blue', num)}
                    {isEditing && ' →'}
                  </button>
                ))}
              </div>
            </div>

            {/* 벤치 */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">
                벤치 - {benchBlue.length}명
              </p>
              <div className="flex flex-wrap gap-2">
                {benchBlue.map(num => (
                  <button
                    key={num}
                    onClick={() => isEditing && movePlayer('blue', 'bench', num)}
                    disabled={!isEditing}
                    className={`px-3 py-2 bg-blue-100 text-blue-700 rounded ${
                      isEditing ? 'hover:bg-blue-200 cursor-pointer' : ''
                    }`}
                  >
                    {num}. {getMemberName('blue', num)}
                    {isEditing && ' →'}
                  </button>
                ))}
                {benchBlue.length === 0 && (
                  <span className="text-sm text-gray-400">벤치 선수 없음</span>
                )}
              </div>
            </div>
          </div>

          {/* 화이트팀 */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-600 mb-3">화이트팀</h3>

            {/* 출전 */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-700">
                  출전 (코트) - {playingWhite.length}명
                </p>
                {playingWhite.length !== 5 && isEditing && (
                  <span className="text-xs text-red-500">5명 필요</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {playingWhite.map(num => (
                  <button
                    key={num}
                    onClick={() => isEditing && movePlayer('white', 'playing', num)}
                    disabled={!isEditing}
                    className={`px-3 py-2 bg-gray-600 text-white rounded font-medium ${
                      isEditing ? 'hover:bg-gray-700 cursor-pointer' : ''
                    }`}
                  >
                    {num}. {getMemberName('white', num)}
                    {isEditing && ' →'}
                  </button>
                ))}
              </div>
            </div>

            {/* 벤치 */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">
                벤치 - {benchWhite.length}명
              </p>
              <div className="flex flex-wrap gap-2">
                {benchWhite.map(num => (
                  <button
                    key={num}
                    onClick={() => isEditing && movePlayer('white', 'bench', num)}
                    disabled={!isEditing}
                    className={`px-3 py-2 bg-gray-100 text-gray-700 rounded border border-gray-300 ${
                      isEditing ? 'hover:bg-gray-200 cursor-pointer' : ''
                    }`}
                  >
                    {num}. {getMemberName('white', num)}
                    {isEditing && ' →'}
                  </button>
                ))}
                {benchWhite.length === 0 && (
                  <span className="text-sm text-gray-400">벤치 선수 없음</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex items-center justify-between">
          {!isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                ✏️ 선수 변경
              </button>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  취소
                </button>
                <button
                  onClick={handleStartAsIs}
                  className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 font-semibold"
                >
                  🏀 이대로 시작
                </button>
              </div>
            </>
          ) : (
            <div className="w-full flex justify-between">
              <button
                onClick={() => {
                  // 원래대로 복원
                  setPlayingBlue(preview.playing_blue || [])
                  setBenchBlue(preview.bench_blue || [])
                  setPlayingWhite(preview.playing_white || [])
                  setBenchWhite(preview.bench_white || [])
                  setIsEditing(false)
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                원래대로
              </button>
              <button
                onClick={handleStartAsIs}
                disabled={!canConfirm}
                className={`px-6 py-2 rounded font-semibold ${
                  canConfirm
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                🏀 수정 완료 및 시작
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
