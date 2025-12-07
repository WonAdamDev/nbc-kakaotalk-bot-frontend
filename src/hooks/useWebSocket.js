import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'

/**
 * WebSocket 연결 관리 Hook
 * @param {string} gameId - 경기 ID
 * @param {function} onGameUpdate - 게임 업데이트 콜백
 */
export default function useWebSocket(gameId, onGameUpdate) {
  const socketRef = useRef(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Socket.io 클라이언트 생성
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    })

    socketRef.current = socket

    // 연결 이벤트
    socket.on('connect', () => {
      console.log('[WebSocket] Connected')
      setIsConnected(true)

      // 경기 방 참여
      socket.emit('join_game', { game_id: gameId })
    })

    // 연결 해제 이벤트
    socket.on('disconnect', () => {
      console.log('[WebSocket] Disconnected')
      setIsConnected(false)
    })

    // 경기 방 참여 확인
    socket.on('joined_game', (data) => {
      console.log('[WebSocket] Joined game:', data.game_id)
    })

    // 게임 업데이트 수신
    socket.on('game_update', (data) => {
      console.log('[WebSocket] Game update:', data.type, data.data)
      if (onGameUpdate) {
        onGameUpdate(data)
      }
    })

    // 게임 상태 수신
    socket.on('game_state', (data) => {
      console.log('[WebSocket] Game state received')
      if (onGameUpdate) {
        onGameUpdate({
          type: 'game_state',
          data: data
        })
      }
    })

    // 에러 처리
    socket.on('error', (error) => {
      console.error('[WebSocket] Error:', error)
    })

    // 클린업
    return () => {
      console.log('[WebSocket] Disconnecting...')
      socket.emit('leave_game', { game_id: gameId })
      socket.disconnect()
    }
  }, [gameId, onGameUpdate])

  // 게임 상태 요청 함수
  const requestGameState = () => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('request_game_state', { game_id: gameId })
    }
  }

  return {
    socket: socketRef.current,
    isConnected,
    requestGameState
  }
}
