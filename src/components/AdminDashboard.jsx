import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import DataManagement from './DataManagement'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('members')
  const [rooms, setRooms] = useState([])
  const [selectedRoom, setSelectedRoom] = useState('')
  const [members, setMembers] = useState([])
  const [teams, setTeams] = useState([])
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(false)
  const [memberSearchQuery, setMemberSearchQuery] = useState('') // 멤버 검색어

  // 폼 데이터
  const [memberForm, setMemberForm] = useState({ name: '' })
  const [teamForm, setTeamForm] = useState({ name: '' })
  const [gameForm, setGameForm] = useState({ creator: '', date: '' })
  const [assignForm, setAssignForm] = useState({ memberId: '', teamId: '' })

  // 인증 확인 및 axios 인터셉터 설정
  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      navigate('/admin/login')
      return
    }

    // axios 응답 인터셉터 설정 (401 에러 시 로그인 페이지로 리다이렉트)
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.warn('[AUTH] 인증 실패 - 로그인 페이지로 이동')
          localStorage.removeItem('admin_token')
          navigate('/admin/login')
        }
        return Promise.reject(error)
      }
    )

    // cleanup: 컴포넌트 언마운트 시 인터셉터 제거
    return () => {
      axios.interceptors.response.eject(interceptor)
    }
  }, [navigate])

  // Axios 설정 생성
  const getAxiosConfig = () => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      console.warn('[AUTH] No token found in localStorage')
      return {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    }
    return {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }
  }

  // 공통 에러 핸들러
  const handleApiError = (err, defaultMessage) => {
    // 401 에러는 인터셉터가 처리하므로 무시
    if (err.response?.status === 401) {
      return
    }

    const message = err.response?.data?.message || err.response?.data?.error || err.message
    alert(`${defaultMessage}: ${message}`)
  }

  // 로그아웃
  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    navigate('/')
  }

  // 방 목록 로드
  const loadRooms = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/game/rooms`)
      if (response.data.success) {
        setRooms(response.data.data.rooms)
        if (response.data.data.rooms.length > 0 && !selectedRoom) {
          setSelectedRoom(response.data.data.rooms[0])
        }
      }
    } catch (err) {
      console.error('Failed to load rooms:', err)
    }
  }

  // 멤버 목록 로드
  const loadMembers = async () => {
    if (!selectedRoom) return

    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/api/commands/member/list`, {
        params: { room: selectedRoom }
      })
      if (response.data.success) {
        setMembers(response.data.data.members)
      }
    } catch (err) {
      console.error('Failed to load members:', err)
    } finally {
      setLoading(false)
    }
  }

  // 팀 목록 로드
  const loadTeams = async () => {
    if (!selectedRoom) return

    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/api/commands/team/list`, {
        params: { room: selectedRoom }
      })
      if (response.data.success) {
        setTeams(response.data.data.teams)
      }
    } catch (err) {
      console.error('Failed to load teams:', err)
    } finally {
      setLoading(false)
    }
  }

  // 경기 목록 로드
  const loadGames = async () => {
    if (!selectedRoom) return

    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/api/game/all`, {
        params: { room: selectedRoom, limit: 100 }
      })
      if (response.data.success) {
        setGames(response.data.data.games)
      }
    } catch (err) {
      console.error('Failed to load games:', err)
    } finally {
      setLoading(false)
    }
  }

  // 방 변경 시 데이터 로드
  useEffect(() => {
    loadRooms()
  }, [])

  useEffect(() => {
    if (selectedRoom) {
      loadMembers()
      loadTeams()
      loadGames()
    }
  }, [selectedRoom])

  // 멤버 생성
  const handleCreateMember = async (e) => {
    e.preventDefault()
    if (!memberForm.name.trim()) return

    try {
      const response = await axios.post(
        `${API_URL}/api/commands/member`,
        { room: selectedRoom, member: memberForm.name },
        getAxiosConfig()
      )

      if (response.data.success) {
        alert('멤버가 생성되었습니다.')
        setMemberForm({ name: '' })
        loadMembers()
      }
    } catch (err) {
      handleApiError(err, '멤버 생성 실패')
    }
  }

  // 멤버 삭제
  const handleDeleteMember = async (memberId, memberName) => {
    if (!confirm(`${memberName} 멤버를 삭제하시겠습니까?`)) return

    try {
      const config = getAxiosConfig()
      config.data = { room: selectedRoom, member: memberName, member_id: memberId }

      const response = await axios.delete(`${API_URL}/api/commands/member`, config)

      if (response.data.success) {
        alert('멤버가 삭제되었습니다.')
        loadMembers()
      }
    } catch (err) {
      handleApiError(err, '멤버 삭제 실패')
    }
  }

  // 팀 생성
  const handleCreateTeam = async (e) => {
    e.preventDefault()
    if (!teamForm.name.trim()) return

    try {
      const response = await axios.post(
        `${API_URL}/api/commands/team`,
        { room: selectedRoom, team: teamForm.name },
        getAxiosConfig()
      )

      if (response.data.success) {
        alert('팀이 생성되었습니다.')
        setTeamForm({ name: '' })
        loadTeams()
      }
    } catch (err) {
      handleApiError(err, '팀 생성 실패')
    }
  }

  // 팀 삭제
  const handleDeleteTeam = async (teamName) => {
    if (!confirm(`${teamName} 팀을 삭제하시겠습니까?`)) return

    try {
      const config = getAxiosConfig()
      config.data = { room: selectedRoom, team: teamName }

      const response = await axios.delete(`${API_URL}/api/commands/team`, config)

      if (response.data.success) {
        alert('팀이 삭제되었습니다.')
        loadTeams()
      }
    } catch (err) {
      handleApiError(err, '팀 삭제 실패')
    }
  }

  // 팀 배정
  const handleAssignTeam = async (e) => {
    e.preventDefault()
    if (!assignForm.memberId || !assignForm.teamId) {
      alert('멤버와 팀을 모두 선택해주세요.')
      return
    }

    const member = members.find(m => m.member_id === assignForm.memberId)
    const team = teams.find(t => t.team_id === assignForm.teamId)

    console.log('[팀 배정] 선택된 멤버:', member)
    console.log('[팀 배정] 선택된 팀:', team)

    if (!member || !team) {
      alert('멤버 또는 팀을 찾을 수 없습니다.')
      return
    }

    const requestData = {
      room: selectedRoom,
      member: member.name,
      member_id: assignForm.memberId,
      team: team.name
    }

    console.log('[팀 배정] 요청 URL:', `${API_URL}/api/commands/member_team`)
    console.log('[팀 배정] 요청 데이터:', requestData)
    console.log('[팀 배정] 인증 헤더:', getAxiosConfig())

    try {
      const response = await axios.post(
        `${API_URL}/api/commands/member_team`,
        requestData,
        getAxiosConfig()
      )

      console.log('[팀 배정] 응답:', response.data)

      if (response.data.success) {
        alert('팀이 배정되었습니다.')
        setAssignForm({ memberId: '', teamId: '' })
        loadMembers()
      }
    } catch (err) {
      console.error('[팀 배정] 에러 상세:', err)
      console.error('[팀 배정] 에러 응답:', err.response)
      handleApiError(err, '팀 배정 실패')
    }
  }

  // 팀 배정 해제
  const handleUnassignTeam = async (memberId, memberName) => {
    if (!confirm(`${memberName}의 팀 배정을 해제하시겠습니까?`)) return

    try {
      const config = getAxiosConfig()
      config.data = { room: selectedRoom, member: memberName, member_id: memberId }

      const response = await axios.delete(`${API_URL}/api/commands/member_team`, config)

      if (response.data.success) {
        alert('팀 배정이 해제되었습니다.')
        loadMembers()
      }
    } catch (err) {
      handleApiError(err, '팀 배정 해제 실패')
    }
  }

  // 경기 생성
  const handleCreateGame = async (e) => {
    e.preventDefault()

    try {
      const response = await axios.post(
        `${API_URL}/api/game/create`,
        {
          room: selectedRoom,
          creator: gameForm.creator || 'Admin',
          date: gameForm.date || undefined
        },
        getAxiosConfig()
      )

      if (response.data.success) {
        alert('경기가 생성되었습니다.')
        setGameForm({ creator: '', date: '' })
        loadGames()
      }
    } catch (err) {
      handleApiError(err, '경기 생성 실패')
    }
  }

  // 경기 삭제
  const handleDeleteGame = async (gameId) => {
    if (!confirm('경기를 삭제하시겠습니까?')) return

    try {
      await axios.delete(`${API_URL}/api/game/${gameId}`, getAxiosConfig())
      alert('경기가 삭제되었습니다.')
      loadGames()
    } catch (err) {
      handleApiError(err, '경기 삭제 실패')
    }
  }

  // 경기 복사 (이어하기)
  const handleCopyGame = async (gameId) => {
    if (!confirm('이 경기의 선수들로 새 경기를 생성하시겠습니까?')) return

    try {
      const response = await axios.post(
        `${API_URL}/api/game/${gameId}/copy`,
        {},
        getAxiosConfig()
      )

      if (response.data.success) {
        alert(`새 경기가 생성되었습니다.\n복사된 선수: ${response.data.data.copied_players}명`)
        loadGames()

        // 새 경기 페이지로 이동할지 물어보기
        if (confirm('새 경기 페이지로 이동하시겠습니까?')) {
          navigate(`/game/${response.data.data.game_id}`)
        }
      }
    } catch (err) {
      handleApiError(err, '경기 복사 실패')
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">관리자 대시보드</h1>
            <p className="text-gray-400">멤버, 팀, 경기를 관리할 수 있습니다</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/')}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              홈으로
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>

        {/* 방 선택 */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">방 선택</label>
          <select
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
          >
            {rooms.map((room) => (
              <option key={room} value={room}>
                {room}
              </option>
            ))}
          </select>
        </div>

        {/* 탭 */}
        <div className="mb-6">
          <div className="flex gap-2 border-b border-gray-700">
            <button
              onClick={() => setActiveTab('members')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'members'
                  ? 'text-blue-500 border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              멤버 관리
            </button>
            <button
              onClick={() => setActiveTab('teams')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'teams'
                  ? 'text-blue-500 border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              팀 관리
            </button>
            <button
              onClick={() => setActiveTab('assign')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'assign'
                  ? 'text-blue-500 border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              팀 배정
            </button>
            <button
              onClick={() => setActiveTab('games')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'games'
                  ? 'text-blue-500 border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              경기 관리
            </button>
            <button
              onClick={() => setActiveTab('data')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'data'
                  ? 'text-blue-500 border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              데이터 관리
            </button>
          </div>
        </div>

        {/* 멤버 관리 */}
        {activeTab === 'members' && (
          <div className="space-y-6">
            {/* 멤버 생성 폼 */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">멤버 생성</h2>
              <form onSubmit={handleCreateMember} className="flex gap-3">
                <input
                  type="text"
                  value={memberForm.name}
                  onChange={(e) => setMemberForm({ name: e.target.value })}
                  placeholder="멤버 이름"
                  className="flex-1 bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                  required
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  생성
                </button>
              </form>
            </div>

            {/* 멤버 목록 */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                멤버 목록 ({members.length}명)
              </h2>

              {/* 검색 입력 */}
              <div className="mb-4">
                <input
                  type="text"
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  placeholder="🔍 멤버 이름으로 검색..."
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                />
                {memberSearchQuery && (
                  <p className="text-sm text-gray-400 mt-2">
                    검색 결과: {members.filter(member =>
                      member.name.toLowerCase().includes(memberSearchQuery.toLowerCase())
                    ).length}명
                  </p>
                )}
              </div>

              <div className="space-y-2">
                {members
                  .filter(member =>
                    memberSearchQuery.trim()
                      ? member.name.toLowerCase().includes(memberSearchQuery.toLowerCase())
                      : true
                  )
                  .map((member) => (
                  <div
                    key={member.member_id}
                    className="flex items-center justify-between bg-gray-700 p-4 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-white font-medium">{member.name}</p>
                      <p className="text-xs text-gray-500 font-mono">ID: {member.member_id}</p>
                      <p className="text-sm text-gray-400">
                        {member.team ? `팀: ${member.team}` : '팀 미배정'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {member.team && (
                        <button
                          onClick={() => handleUnassignTeam(member.member_id, member.name)}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          팀 해제
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteMember(member.member_id, member.name)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
                {members.filter(member =>
                  memberSearchQuery.trim()
                    ? member.name.toLowerCase().includes(memberSearchQuery.toLowerCase())
                    : true
                ).length === 0 && (
                  <p className="text-gray-400 text-center py-8">
                    {memberSearchQuery ? '검색 결과가 없습니다.' : '멤버가 없습니다.'}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 팀 관리 */}
        {activeTab === 'teams' && (
          <div className="space-y-6">
            {/* 팀 생성 폼 */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">팀 생성</h2>
              <form onSubmit={handleCreateTeam} className="flex gap-3">
                <input
                  type="text"
                  value={teamForm.name}
                  onChange={(e) => setTeamForm({ name: e.target.value })}
                  placeholder="팀 이름"
                  className="flex-1 bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                  required
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  생성
                </button>
              </form>
            </div>

            {/* 팀 목록 */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                팀 목록 ({teams.length}개)
              </h2>
              <div className="space-y-2">
                {teams.map((team) => (
                  <div
                    key={team.team_id}
                    className="flex items-center justify-between bg-gray-700 p-4 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-white font-medium">{team.name}</p>
                      <p className="text-xs text-gray-500 font-mono">ID: {team.team_id}</p>
                      <p className="text-sm text-gray-400">멤버 수: {team.member_count}명</p>
                    </div>
                    <button
                      onClick={() => handleDeleteTeam(team.name)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                ))}
                {teams.length === 0 && (
                  <p className="text-gray-400 text-center py-8">팀이 없습니다.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 팀 배정 */}
        {activeTab === 'assign' && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">팀 배정</h2>
            <form onSubmit={handleAssignTeam} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">멤버 선택</label>
                <select
                  value={assignForm.memberId}
                  onChange={(e) => setAssignForm({ ...assignForm, memberId: e.target.value })}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="">멤버를 선택하세요</option>
                  {members.map((member) => (
                    <option key={member.member_id} value={member.member_id}>
                      {member.name} [ID: {member.member_id}] {member.team && `(현재: ${member.team})`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">팀 선택</label>
                <select
                  value={assignForm.teamId}
                  onChange={(e) => setAssignForm({ ...assignForm, teamId: e.target.value })}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="">팀을 선택하세요</option>
                  {teams.map((team) => (
                    <option key={team.team_id} value={team.team_id}>
                      {team.name} [ID: {team.team_id}] ({team.member_count}명)
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                팀 배정하기
              </button>
            </form>
          </div>
        )}

        {/* 경기 관리 */}
        {activeTab === 'games' && (
          <div className="space-y-6">
            {/* 경기 생성 폼 */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">경기 생성</h2>
              <form onSubmit={handleCreateGame} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    생성자 (선택)
                  </label>
                  <input
                    type="text"
                    value={gameForm.creator}
                    onChange={(e) => setGameForm({ ...gameForm, creator: e.target.value })}
                    placeholder="Admin"
                    className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    경기 날짜 (선택)
                  </label>
                  <input
                    type="date"
                    value={gameForm.date}
                    onChange={(e) => setGameForm({ ...gameForm, date: e.target.value })}
                    className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  경기 생성
                </button>
              </form>
            </div>

            {/* 경기 목록 - 상태별 */}
            <div className="space-y-6">
              {/* 준비중 경기 */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-bold text-white mb-4">
                  ⏳ 준비중 ({games.filter(g => g.status === '준비중').length}개)
                </h2>
                <div className="space-y-2">
                  {games.filter(g => g.status === '준비중').map((game) => (
                    <div
                      key={game.game_id}
                      className="flex items-center justify-between bg-gray-700 p-4 rounded-lg"
                    >
                      <div>
                        <p className="text-white font-medium">경기 ID: {game.game_id}</p>
                        <p className="text-sm text-gray-400">
                          생성자: {game.creator || '-'} | 날짜: {game.date || '-'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/game/${game.game_id}`)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          보기
                        </button>
                        <button
                          onClick={() => handleDeleteGame(game.game_id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                  {games.filter(g => g.status === '준비중').length === 0 && (
                    <p className="text-gray-400 text-center py-4">준비중인 경기가 없습니다.</p>
                  )}
                </div>
              </div>

              {/* 진행중 경기 */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-bold text-white mb-4">
                  ▶️ 진행중 ({games.filter(g => g.status === '진행중').length}개)
                </h2>
                <div className="space-y-2">
                  {games.filter(g => g.status === '진행중').map((game) => (
                    <div
                      key={game.game_id}
                      className="flex items-center justify-between bg-gray-700 p-4 rounded-lg border-l-4 border-green-500"
                    >
                      <div>
                        <p className="text-white font-medium">경기 ID: {game.game_id}</p>
                        <p className="text-sm text-gray-400">
                          생성자: {game.creator || '-'} | 쿼터: {game.current_quarter || 0}
                        </p>
                        {game.team_home && game.team_away && (
                          <p className="text-sm text-green-400 mt-1">
                            {game.team_home} vs {game.team_away}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/game/${game.game_id}`)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          보기
                        </button>
                        <button
                          onClick={() => handleDeleteGame(game.game_id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                  {games.filter(g => g.status === '진행중').length === 0 && (
                    <p className="text-gray-400 text-center py-4">진행중인 경기가 없습니다.</p>
                  )}
                </div>
              </div>

              {/* 종료 경기 */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-bold text-white mb-4">
                  ⏹️ 종료 ({games.filter(g => g.status === '종료').length}개)
                </h2>
                <div className="space-y-2">
                  {games.filter(g => g.status === '종료').map((game) => (
                    <div
                      key={game.game_id}
                      className="flex items-center justify-between bg-gray-700 p-4 rounded-lg opacity-75"
                    >
                      <div>
                        <p className="text-white font-medium">경기 ID: {game.game_id}</p>
                        <p className="text-sm text-gray-400">
                          생성자: {game.creator || '-'} | 날짜: {game.date || '-'}
                        </p>
                        {game.team_home && game.team_away && (
                          <p className="text-sm text-gray-400 mt-1">
                            {game.team_home} {game.final_score?.home || 0} : {game.final_score?.away || 0} {game.team_away}
                          </p>
                        )}
                        {game.winner && (
                          <p className="text-sm text-blue-400 mt-1">
                            승자: {game.winner === 'home' ? game.team_home : game.winner === 'away' ? game.team_away : '무승부'}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCopyGame(game.game_id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          🔄 이어하기
                        </button>
                        <button
                          onClick={() => navigate(`/game/${game.game_id}`)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          보기
                        </button>
                        <button
                          onClick={() => handleDeleteGame(game.game_id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                  {games.filter(g => g.status === '종료').length === 0 && (
                    <p className="text-gray-400 text-center py-4">종료된 경기가 없습니다.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 데이터 관리 */}
        {activeTab === 'data' && (
          <DataManagement
            onImportComplete={() => {
              loadMembers()
              loadTeams()
            }}
          />
        )}
      </div>
    </div>
  )
}
