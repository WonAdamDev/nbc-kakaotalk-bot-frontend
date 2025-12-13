export default function LandingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        {/* 로고/아이콘 */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-500 rounded-full mb-4">
            <span className="text-5xl">🏀</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            농구 동호회 경기 관리
          </h1>
          <p className="text-gray-600">
            Basketball Club Manager
          </p>
        </div>

        {/* 안내 메시지 */}
        <div className="card max-w-lg mx-auto">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💬</span>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800 mb-1">
                  카카오톡 봇으로 시작하기
                </h3>
                <p className="text-sm text-gray-600">
                  카카오톡 봇을 통해 경기를 생성하고<br />
                  공유받은 링크로 접속하세요
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-2xl">🔗</span>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800 mb-1">
                  링크를 통한 접속
                </h3>
                <p className="text-sm text-gray-600">
                  경기 URL 또는 방 URL을 통해<br />
                  직접 접속할 수 있습니다
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-2xl">📱</span>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800 mb-1">
                  실시간 경기 관리
                </h3>
                <p className="text-sm text-gray-600">
                  출석 체크, 팀 편성, 점수 기록까지<br />
                  모든 기능을 실시간으로 이용하세요
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 추가 정보 */}
        <div className="mt-8 text-sm text-gray-500">
          <p>
            접근 권한이 필요한 서비스입니다
          </p>
          <p className="mt-2">
            카카오톡 봇을 통해 초대받거나<br />
            공유받은 링크를 통해 접속해주세요
          </p>
        </div>

        {/* 푸터 */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} 농구 동호회 경기 관리 시스템
          </p>
        </div>
      </div>
    </div>
  )
}
