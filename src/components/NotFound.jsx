export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-8">페이지를 찾을 수 없습니다</p>
        <p className="text-gray-500">
          경기 관리 페이지는 카카오톡 봇에서 !경기생성 명령어로 생성할 수 있습니다.
        </p>
      </div>
    </div>
  )
}
