import { useState, useEffect } from 'react'

export default function QuarterStartModal({
  isOpen,
  onClose,
  preview,
  lineups,
  game,
  onConfirm
}) {
  const [playingBlue, setPlayingBlue] = useState([])
  const [benchBlue, setBenchBlue] = useState([])
  const [playingWhite, setPlayingWhite] = useState([])
  const [benchWhite, setBenchWhite] = useState([])
  const [draggedItem, setDraggedItem] = useState(null)
  const [dragOverItem, setDragOverItem] = useState(null)

  // 팀 이름 표시 (팀 선택 전: HOME/AWAY, 선택 후: 팀 이름)
  const homeTeamName = game?.team_home || 'HOME'
  const awayTeamName = game?.team_away || 'AWAY'

  // 초기화: 전체 라인업을 벤치로 설정
  useEffect(() => {
    if (preview && lineups) {
      setPlayingBlue([])
      setBenchBlue(lineups.블루?.map(l => l.number) || [])
      setPlayingWhite([])
      setBenchWhite(lineups.화이트?.map(l => l.number) || [])
    }
  }, [preview, lineups])

  if (!isOpen || !preview) return null

  // 선수 번호로 이름 찾기
  const getMemberName = (team, number) => {
    const teamKey = team === 'blue' ? '블루' : '화이트'
    const lineup = lineups?.[teamKey]?.find(l => l.number === number)
    return lineup ? lineup.member : `#${number}`
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

  // 드래그 시작
  const handleDragStart = (e, team, position, index, number) => {
    setDraggedItem({ team, position, index, number })
    e.dataTransfer.effectAllowed = 'move'
  }

  // 드래그 오버
  const handleDragOver = (e, team, position, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'

    // 같은 팀이면 출전↔벤치 간에도 드롭 가능
    if (draggedItem && draggedItem.team === team) {
      // 같은 position이고 같은 index면 스킵
      if (draggedItem.position === position && draggedItem.index === index) {
        return
      }
      setDragOverItem({ team, position, index })
    }
  }

  // 드래그 떠남
  const handleDragLeave = () => {
    setDragOverItem(null)
  }

  // 드롭
  const handleDrop = (e, team, position, toIndex) => {
    e.preventDefault()
    setDragOverItem(null)

    if (!draggedItem || draggedItem.team !== team) {
      setDraggedItem(null)
      return
    }

    const fromPosition = draggedItem.position
    const fromIndex = draggedItem.index

    // 같은 위치의 같은 인덱스면 스킵
    if (fromPosition === position && fromIndex === toIndex) {
      setDraggedItem(null)
      return
    }

    // 같은 position 내에서 교체
    if (fromPosition === position) {
      if (team === 'blue') {
        if (position === 'playing') {
          setPlayingBlue(prev => {
            const newArr = [...prev]
            const temp = newArr[fromIndex]
            newArr[fromIndex] = newArr[toIndex]
            newArr[toIndex] = temp
            return newArr
          })
        } else {
          setBenchBlue(prev => {
            const newArr = [...prev]
            const temp = newArr[fromIndex]
            newArr[fromIndex] = newArr[toIndex]
            newArr[toIndex] = temp
            return newArr
          })
        }
      } else {
        if (position === 'playing') {
          setPlayingWhite(prev => {
            const newArr = [...prev]
            const temp = newArr[fromIndex]
            newArr[fromIndex] = newArr[toIndex]
            newArr[toIndex] = temp
            return newArr
          })
        } else {
          setBenchWhite(prev => {
            const newArr = [...prev]
            const temp = newArr[fromIndex]
            newArr[fromIndex] = newArr[toIndex]
            newArr[toIndex] = temp
            return newArr
          })
        }
      }
    } else {
      // 다른 position 간 교체 (출전 ↔ 벤치)
      if (team === 'blue') {
        if (fromPosition === 'playing') {
          // 출전 → 벤치
          const playingPlayer = playingBlue[fromIndex]
          const benchPlayer = benchBlue[toIndex]

          setPlayingBlue(prev => {
            const newArr = [...prev]
            newArr[fromIndex] = benchPlayer
            return newArr
          })
          setBenchBlue(prev => {
            const newArr = [...prev]
            newArr[toIndex] = playingPlayer
            return newArr
          })
        } else {
          // 벤치 → 출전
          const benchPlayer = benchBlue[fromIndex]
          const playingPlayer = playingBlue[toIndex]

          setBenchBlue(prev => {
            const newArr = [...prev]
            newArr[fromIndex] = playingPlayer
            return newArr
          })
          setPlayingBlue(prev => {
            const newArr = [...prev]
            newArr[toIndex] = benchPlayer
            return newArr
          })
        }
      } else {
        if (fromPosition === 'playing') {
          // 출전 → 벤치
          const playingPlayer = playingWhite[fromIndex]
          const benchPlayer = benchWhite[toIndex]

          setPlayingWhite(prev => {
            const newArr = [...prev]
            newArr[fromIndex] = benchPlayer
            return newArr
          })
          setBenchWhite(prev => {
            const newArr = [...prev]
            newArr[toIndex] = playingPlayer
            return newArr
          })
        } else {
          // 벤치 → 출전
          const benchPlayer = benchWhite[fromIndex]
          const playingPlayer = playingWhite[toIndex]

          setBenchWhite(prev => {
            const newArr = [...prev]
            newArr[fromIndex] = playingPlayer
            return newArr
          })
          setPlayingWhite(prev => {
            const newArr = [...prev]
            newArr[toIndex] = benchPlayer
            return newArr
          })
        }
      }
    }

    setDraggedItem(null)
  }

  // 드래그 종료
  const handleDragEnd = () => {
    setDraggedItem(null)
    setDragOverItem(null)
  }

  // 선수 이동 (출전 ↔ 벤치)
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
            ✨ 각 팀당 출전 선수 5명을 선택하세요. 드래그하여 순서 변경 / 클릭하여 출전↔벤치 이동
          </p>

          {/* HOME */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-blue-600 mb-3">{homeTeamName}</h3>

            {/* 출전 */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-700">
                  출전 (코트) - {playingBlue.length}명
                </p>
                {playingBlue.length !== 5 && (
                  <span className="text-xs text-red-500">5명 필요</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {playingBlue.map((num, index) => {
                  const isDragging = draggedItem?.team === 'blue' && draggedItem?.position === 'playing' && draggedItem?.index === index
                  const isDropTarget = dragOverItem?.team === 'blue' && dragOverItem?.position === 'playing' && dragOverItem?.index === index

                  return (
                    <div
                      key={num}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, 'blue', 'playing', index, num)}
                      onDragOver={(e) => handleDragOver(e, 'blue', 'playing', index)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, 'blue', 'playing', index)}
                      onDragEnd={handleDragEnd}
                      onClick={() => movePlayer('blue', 'playing', num)}
                      className={`
                        px-3 py-2 bg-blue-500 text-white rounded font-medium transition-all
                        ${isDragging ? 'opacity-50 scale-95' : ''}
                        ${isDropTarget ? 'ring-2 ring-blue-300' : ''}
                        hover:bg-blue-600 cursor-move
                      `}
                    >
                      {num}. {getMemberName('blue', num)} ⇄
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 벤치 */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">
                벤치 - {benchBlue.length}명
              </p>
              <div className="flex flex-wrap gap-2">
                {benchBlue.map((num, index) => {
                  const isDragging = draggedItem?.team === 'blue' && draggedItem?.position === 'bench' && draggedItem?.index === index
                  const isDropTarget = dragOverItem?.team === 'blue' && dragOverItem?.position === 'bench' && dragOverItem?.index === index

                  return (
                    <div
                      key={num}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, 'blue', 'bench', index, num)}
                      onDragOver={(e) => handleDragOver(e, 'blue', 'bench', index)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, 'blue', 'bench', index)}
                      onDragEnd={handleDragEnd}
                      onClick={() => movePlayer('blue', 'bench', num)}
                      className={`
                        px-3 py-2 bg-blue-100 text-blue-700 rounded transition-all
                        ${isDragging ? 'opacity-50 scale-95' : ''}
                        ${isDropTarget ? 'ring-2 ring-blue-300' : ''}
                        hover:bg-blue-200 cursor-move
                      `}
                    >
                      {num}. {getMemberName('blue', num)} ⇄
                    </div>
                  )
                })}
                {benchBlue.length === 0 && (
                  <span className="text-sm text-gray-400">벤치 선수 없음</span>
                )}
              </div>
            </div>
          </div>

          {/* AWAY */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-600 mb-3">{awayTeamName}</h3>

            {/* 출전 */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-700">
                  출전 (코트) - {playingWhite.length}명
                </p>
                {playingWhite.length !== 5 && (
                  <span className="text-xs text-red-500">5명 필요</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {playingWhite.map((num, index) => {
                  const isDragging = draggedItem?.team === 'white' && draggedItem?.position === 'playing' && draggedItem?.index === index
                  const isDropTarget = dragOverItem?.team === 'white' && dragOverItem?.position === 'playing' && dragOverItem?.index === index

                  return (
                    <div
                      key={num}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, 'white', 'playing', index, num)}
                      onDragOver={(e) => handleDragOver(e, 'white', 'playing', index)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, 'white', 'playing', index)}
                      onDragEnd={handleDragEnd}
                      onClick={() => movePlayer('white', 'playing', num)}
                      className={`
                        px-3 py-2 bg-gray-600 text-white rounded font-medium transition-all
                        ${isDragging ? 'opacity-50 scale-95' : ''}
                        ${isDropTarget ? 'ring-2 ring-gray-400' : ''}
                        hover:bg-gray-700 cursor-move
                      `}
                    >
                      {num}. {getMemberName('white', num)} ⇄
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 벤치 */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">
                벤치 - {benchWhite.length}명
              </p>
              <div className="flex flex-wrap gap-2">
                {benchWhite.map((num, index) => {
                  const isDragging = draggedItem?.team === 'white' && draggedItem?.position === 'bench' && draggedItem?.index === index
                  const isDropTarget = dragOverItem?.team === 'white' && dragOverItem?.position === 'bench' && dragOverItem?.index === index

                  return (
                    <div
                      key={num}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, 'white', 'bench', index, num)}
                      onDragOver={(e) => handleDragOver(e, 'white', 'bench', index)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, 'white', 'bench', index)}
                      onDragEnd={handleDragEnd}
                      onClick={() => movePlayer('white', 'bench', num)}
                      className={`
                        px-3 py-2 bg-gray-100 text-gray-700 rounded border border-gray-300 transition-all
                        ${isDragging ? 'opacity-50 scale-95' : ''}
                        ${isDropTarget ? 'ring-2 ring-gray-400' : ''}
                        hover:bg-gray-200 cursor-move
                      `}
                    >
                      {num}. {getMemberName('white', num)} ⇄
                    </div>
                  )
                })}
                {benchWhite.length === 0 && (
                  <span className="text-sm text-gray-400">벤치 선수 없음</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            취소
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
            🏀 쿼터 시작 ({playingBlue.length}/5 vs {playingWhite.length}/5)
          </button>
        </div>
      </div>
    </div>
  )
}
