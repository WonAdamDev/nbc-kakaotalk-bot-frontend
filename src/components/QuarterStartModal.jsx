import { useState, useEffect } from 'react'

export default function QuarterStartModal({
  isOpen,
  onClose,
  preview,
  lineups,
  game,
  onConfirm
}) {
  const [playingHome, setPlayingHome] = useState([])
  const [benchHome, setBenchHome] = useState([])
  const [playingAway, setPlayingAway] = useState([])
  const [benchAway, setBenchAway] = useState([])
  const [draggedItem, setDraggedItem] = useState(null)
  const [dragOverItem, setDragOverItem] = useState(null)

  // 팀 이름 표시 (팀 선택 전: HOME/AWAY, 선택 후: 팀 이름)
  const homeTeamName = game?.team_home || 'HOME'
  const awayTeamName = game?.team_away || 'AWAY'

  // 초기화: playing_status에 따라 출전/벤치 자동 배치
  useEffect(() => {
    if (preview && lineups) {
      // home팀
      const homeLineups = lineups.home || []
      const homePlayingPlayers = homeLineups
        .filter(l => (l.playing_status || 'playing') === 'playing')
        .map(l => l.number)
      const homeBenchPlayers = homeLineups
        .filter(l => (l.playing_status || 'playing') === 'bench')
        .map(l => l.number)

      setPlayingHome(homePlayingPlayers)
      setBenchHome(homeBenchPlayers)

      // away팀
      const awayLineups = lineups.away || []
      const awayPlayingPlayers = awayLineups
        .filter(l => (l.playing_status || 'playing') === 'playing')
        .map(l => l.number)
      const awayBenchPlayers = awayLineups
        .filter(l => (l.playing_status || 'playing') === 'bench')
        .map(l => l.number)

      setPlayingAway(awayPlayingPlayers)
      setBenchAway(awayBenchPlayers)
    }
  }, [preview, lineups])

  if (!isOpen || !preview) return null

  // 선수 번호로 이름 찾기 (동명이인 있으면 ID 표시)
  const getMemberName = (team, number) => {
    const teamKey = team === 'home' ? 'home' : 'away'
    const lineup = lineups?.[teamKey]?.find(l => l.number === number)

    if (!lineup) return `#${number}`

    // 전체 라인업에서 동명이인 확인
    const allLineups = [...(lineups?.home || []), ...(lineups?.away || [])]
    const duplicateNames = allLineups.filter(l => l.member === lineup.member)
    const hasDuplicate = duplicateNames.length > 1

    // 동명이인이 있거나 member_id가 있으면 ID 표시
    if (hasDuplicate && lineup.member_id) {
      return `${lineup.member} #${lineup.member_id.slice(-4)}`
    }

    return lineup.member
  }

  // 이대로 시작
  const handleStartAsIs = () => {
    onConfirm({
      playing_home: playingHome,
      bench_home: benchHome,
      playing_away: playingAway,
      bench_away: benchAway
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
      if (team === 'home') {
        if (position === 'playing') {
          setPlayingHome(prev => {
            const newArr = [...prev]
            const temp = newArr[fromIndex]
            newArr[fromIndex] = newArr[toIndex]
            newArr[toIndex] = temp
            return newArr
          })
        } else {
          setBenchHome(prev => {
            const newArr = [...prev]
            const temp = newArr[fromIndex]
            newArr[fromIndex] = newArr[toIndex]
            newArr[toIndex] = temp
            return newArr
          })
        }
      } else {
        if (position === 'playing') {
          setPlayingAway(prev => {
            const newArr = [...prev]
            const temp = newArr[fromIndex]
            newArr[fromIndex] = newArr[toIndex]
            newArr[toIndex] = temp
            return newArr
          })
        } else {
          setBenchAway(prev => {
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
      if (team === 'home') {
        if (fromPosition === 'playing') {
          // 출전 → 벤치
          const playingPlayer = playingHome[fromIndex]
          const benchPlayer = benchHome[toIndex]

          setPlayingHome(prev => {
            const newArr = [...prev]
            newArr[fromIndex] = benchPlayer
            return newArr
          })
          setBenchHome(prev => {
            const newArr = [...prev]
            newArr[toIndex] = playingPlayer
            return newArr
          })
        } else {
          // 벤치 → 출전
          const benchPlayer = benchHome[fromIndex]
          const playingPlayer = playingHome[toIndex]

          setBenchHome(prev => {
            const newArr = [...prev]
            newArr[fromIndex] = playingPlayer
            return newArr
          })
          setPlayingHome(prev => {
            const newArr = [...prev]
            newArr[toIndex] = benchPlayer
            return newArr
          })
        }
      } else {
        if (fromPosition === 'playing') {
          // 출전 → 벤치
          const playingPlayer = playingAway[fromIndex]
          const benchPlayer = benchAway[toIndex]

          setPlayingAway(prev => {
            const newArr = [...prev]
            newArr[fromIndex] = benchPlayer
            return newArr
          })
          setBenchAway(prev => {
            const newArr = [...prev]
            newArr[toIndex] = playingPlayer
            return newArr
          })
        } else {
          // 벤치 → 출전
          const benchPlayer = benchAway[fromIndex]
          const playingPlayer = playingAway[toIndex]

          setBenchAway(prev => {
            const newArr = [...prev]
            newArr[fromIndex] = playingPlayer
            return newArr
          })
          setPlayingAway(prev => {
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
    if (team === 'home') {
      if (from === 'playing') {
        setPlayingHome(prev => prev.filter(n => n !== number))
        setBenchHome(prev => [...prev, number])
      } else {
        setBenchHome(prev => prev.filter(n => n !== number))
        setPlayingHome(prev => [...prev, number])
      }
    } else {
      if (from === 'playing') {
        setPlayingAway(prev => prev.filter(n => n !== number))
        setBenchAway(prev => [...prev, number])
      } else {
        setBenchAway(prev => prev.filter(n => n !== number))
        setPlayingAway(prev => [...prev, number])
      }
    }
  }

  const canConfirm = playingHome.length === 5 && playingAway.length === 5

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
                  출전 (코트) - {playingHome.length}명
                </p>
                {playingHome.length !== 5 && (
                  <span className="text-xs text-red-500">5명 필요</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {playingHome.map((num, index) => {
                  const isDragging = draggedItem?.team === 'home' && draggedItem?.position === 'playing' && draggedItem?.index === index
                  const isDropTarget = dragOverItem?.team === 'home' && dragOverItem?.position === 'playing' && dragOverItem?.index === index

                  return (
                    <div
                      key={num}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, 'home', 'playing', index, num)}
                      onDragOver={(e) => handleDragOver(e, 'home', 'playing', index)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, 'home', 'playing', index)}
                      onDragEnd={handleDragEnd}
                      onClick={() => movePlayer('home', 'playing', num)}
                      className={`
                        px-3 py-2 bg-blue-500 text-white rounded font-medium transition-all
                        ${isDragging ? 'opacity-50 scale-95' : ''}
                        ${isDropTarget ? 'ring-2 ring-blue-300' : ''}
                        hover:bg-blue-600 cursor-move
                      `}
                    >
                      {num}. {getMemberName('home', num)} ⇄
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 벤치 */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">
                벤치 - {benchHome.length}명
              </p>
              <div className="flex flex-wrap gap-2">
                {benchHome.map((num, index) => {
                  const isDragging = draggedItem?.team === 'home' && draggedItem?.position === 'bench' && draggedItem?.index === index
                  const isDropTarget = dragOverItem?.team === 'home' && dragOverItem?.position === 'bench' && dragOverItem?.index === index

                  return (
                    <div
                      key={num}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, 'home', 'bench', index, num)}
                      onDragOver={(e) => handleDragOver(e, 'home', 'bench', index)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, 'home', 'bench', index)}
                      onDragEnd={handleDragEnd}
                      onClick={() => movePlayer('home', 'bench', num)}
                      className={`
                        px-3 py-2 bg-blue-100 text-blue-700 rounded transition-all
                        ${isDragging ? 'opacity-50 scale-95' : ''}
                        ${isDropTarget ? 'ring-2 ring-blue-300' : ''}
                        hover:bg-blue-200 cursor-move
                      `}
                    >
                      {num}. {getMemberName('home', num)} ⇄
                    </div>
                  )
                })}
                {benchHome.length === 0 && (
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
                  출전 (코트) - {playingAway.length}명
                </p>
                {playingAway.length !== 5 && (
                  <span className="text-xs text-red-500">5명 필요</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {playingAway.map((num, index) => {
                  const isDragging = draggedItem?.team === 'away' && draggedItem?.position === 'playing' && draggedItem?.index === index
                  const isDropTarget = dragOverItem?.team === 'away' && dragOverItem?.position === 'playing' && dragOverItem?.index === index

                  return (
                    <div
                      key={num}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, 'away', 'playing', index, num)}
                      onDragOver={(e) => handleDragOver(e, 'away', 'playing', index)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, 'away', 'playing', index)}
                      onDragEnd={handleDragEnd}
                      onClick={() => movePlayer('away', 'playing', num)}
                      className={`
                        px-3 py-2 bg-gray-600 text-white rounded font-medium transition-all
                        ${isDragging ? 'opacity-50 scale-95' : ''}
                        ${isDropTarget ? 'ring-2 ring-gray-400' : ''}
                        hover:bg-gray-700 cursor-move
                      `}
                    >
                      {num}. {getMemberName('away', num)} ⇄
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 벤치 */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">
                벤치 - {benchAway.length}명
              </p>
              <div className="flex flex-wrap gap-2">
                {benchAway.map((num, index) => {
                  const isDragging = draggedItem?.team === 'away' && draggedItem?.position === 'bench' && draggedItem?.index === index
                  const isDropTarget = dragOverItem?.team === 'away' && dragOverItem?.position === 'bench' && dragOverItem?.index === index

                  return (
                    <div
                      key={num}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, 'away', 'bench', index, num)}
                      onDragOver={(e) => handleDragOver(e, 'away', 'bench', index)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, 'away', 'bench', index)}
                      onDragEnd={handleDragEnd}
                      onClick={() => movePlayer('away', 'bench', num)}
                      className={`
                        px-3 py-2 bg-gray-100 text-gray-700 rounded border border-gray-300 transition-all
                        ${isDragging ? 'opacity-50 scale-95' : ''}
                        ${isDropTarget ? 'ring-2 ring-gray-400' : ''}
                        hover:bg-gray-200 cursor-move
                      `}
                    >
                      {num}. {getMemberName('away', num)} ⇄
                    </div>
                  )
                })}
                {benchAway.length === 0 && (
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
            🏀 쿼터 시작 ({playingHome.length}/5 vs {playingAway.length}/5)
          </button>
        </div>
      </div>
    </div>
  )
}
