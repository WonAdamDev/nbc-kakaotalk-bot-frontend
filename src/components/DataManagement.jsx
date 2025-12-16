import { useState } from 'react'
import axios from 'axios'
import * as XLSX from 'xlsx'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function DataManagement({ onImportComplete }) {
  // Import 상태
  const [file, setFile] = useState(null)
  const [replaceAll, setReplaceAll] = useState(false)
  const [updateMerge, setUpdateMerge] = useState(false)
  const [previewData, setPreviewData] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)
  const [validationErrors, setValidationErrors] = useState([])

  // Export 상태
  const [isExporting, setIsExporting] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(false)

  const getAxiosConfig = () => {
    const token = localStorage.getItem('admin_token')
    return {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  }

  // 파일 선택 핸들러
  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0]
    if (!selectedFile) return

    // 파일 검증
    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      alert('.xlsx 또는 .xls 파일만 지원됩니다')
      return
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      alert('파일 크기는 10MB 이하여야 합니다')
      return
    }

    setFile(selectedFile)
    setUploadResult(null)
    setValidationErrors([])
    setPreviewData(null)

    // 미리보기 생성
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)

        // 첫 50행만 미리보기
        const preview = jsonData.slice(0, 50)
        setPreviewData({
          rows: preview,
          totalCount: jsonData.length,
          hasMore: jsonData.length > 50
        })

        // 간단한 클라이언트 검증
        const errors = []
        preview.forEach((row, index) => {
          if (!row.room || !row.member) {
            errors.push({
              row: index + 2,
              error: 'room과 member는 필수입니다'
            })
          }
        })
        setValidationErrors(errors)

      } catch (error) {
        alert('파일을 읽을 수 없습니다: ' + error.message)
        setFile(null)
      }
    }
    reader.readAsArrayBuffer(selectedFile)
  }

  // 업로드 핸들러
  const handleUpload = async () => {
    if (!file) {
      alert('파일을 선택해주세요')
      return
    }

    // Replace All 모드 확인
    if (replaceAll) {
      const confirmed = confirm(
        '⚠️ 정말로 모든 데이터를 삭제하고 새로 시작하시겠습니까?\n\n' +
        '삭제되는 데이터:\n' +
        '- 모든 방/멤버/팀 데이터\n' +
        '- 모든 경기/라인업/쿼터 데이터 (CASCADE DELETE)\n\n' +
        '이 작업은 되돌릴 수 없습니다!'
      )
      if (!confirmed) return
    }

    // Update/Merge 모드 확인
    if (updateMerge) {
      const confirmed = confirm(
        '🔄 Update/Merge 모드로 Import하시겠습니까?\n\n' +
        '동작:\n' +
        '- ID가 있는 데이터 → 업데이트\n' +
        '- ID가 없는 데이터 → 새로 추가\n' +
        '- 방(Room)은 새로 생성되지 않음 (경기 데이터 보존)\n\n' +
        'Excel에 없는 기존 Room의 방 이름이 있으면 에러가 발생합니다.'
      )
      if (!confirmed) return
    }

    setIsUploading(true)
    setUploadResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('replace_all', replaceAll)
      formData.append('update_merge', updateMerge)

      const response = await axios.post(
        `${API_URL}/api/admin/data/import`,
        formData,
        {
          ...getAxiosConfig(),
          headers: {
            ...getAxiosConfig().headers,
            'Content-Type': 'multipart/form-data'
          }
        }
      )

      setUploadResult(response.data.data)

      // Import 완료 후 콜백
      if (onImportComplete) {
        onImportComplete()
      }

      // 성공 메시지
      alert('Import가 완료되었습니다!')

      // 상태 초기화
      setFile(null)
      setPreviewData(null)
      setValidationErrors([])
      setReplaceAll(false)
      setUpdateMerge(false)

    } catch (error) {
      console.error('Upload error:', error)
      if (error.response?.data?.message) {
        alert('Upload 실패: ' + error.response.data.message)
      } else {
        alert('Upload 중 오류가 발생했습니다')
      }
    } finally {
      setIsUploading(false)
    }
  }

  // Export 핸들러
  const handleExport = async () => {
    setIsExporting(true)
    setExportSuccess(false)

    try {
      const response = await axios.get(
        `${API_URL}/api/admin/data/export`,
        {
          ...getAxiosConfig(),
          responseType: 'blob'
        }
      )

      // Blob 생성 및 다운로드
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url

      // 파일명 생성
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
      link.download = `nbc_members_teams_${timestamp}.xlsx`

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      setExportSuccess(true)
      setTimeout(() => setExportSuccess(false), 3000)

    } catch (error) {
      console.error('Export error:', error)
      if (error.response?.data?.message) {
        alert('Export 실패: ' + error.response.data.message)
      } else {
        alert('Export 중 오류가 발생했습니다')
      }
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Import 섹션 */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-6">📥 Data Import</h2>

        {/* Import 모드 선택 */}
        <div className="mb-4 space-y-3">
          {/* Replace All 옵션 */}
          <div className="p-4 border border-yellow-600/50 bg-gray-800 rounded">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={replaceAll}
                onChange={(e) => {
                  setReplaceAll(e.target.checked)
                  if (e.target.checked) setUpdateMerge(false)
                }}
                className="mr-2 w-4 h-4"
                disabled={isUploading}
              />
              <span className="text-yellow-300 font-medium">
                ⚠️ Replace All Data (모든 방/멤버/팀 데이터 삭제)
              </span>
            </label>
            <p className="text-sm text-gray-300 mt-2 ml-6">
              체크 시 모든 방/멤버/팀 데이터를 삭제하고 Excel로 새로 시작합니다.
            </p>
            <p className="text-sm text-red-300 mt-1 ml-6 font-medium">
              ⚠️ 경고: 모든 경기/라인업/쿼터 데이터도 함께 삭제됩니다 (CASCADE DELETE)
            </p>
          </div>

          {/* Update/Merge 옵션 */}
          <div className="p-4 border border-blue-600/50 bg-gray-800 rounded">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={updateMerge}
                onChange={(e) => {
                  setUpdateMerge(e.target.checked)
                  if (e.target.checked) setReplaceAll(false)
                }}
                className="mr-2 w-4 h-4"
                disabled={isUploading}
              />
              <span className="text-blue-300 font-medium">
                🔄 Update/Merge Mode (ID 기준 업데이트)
              </span>
            </label>
            <p className="text-sm text-gray-300 mt-2 ml-6">
              Excel에 ID가 있으면 해당 데이터를 업데이트하고, ID가 없으면 새로 추가합니다.
            </p>
            <p className="text-sm text-green-300 mt-1 ml-6 font-medium">
              ✅ 방(Room)은 생성하지 않아 경기 데이터가 보존됩니다.
            </p>
          </div>
        </div>

        {/* 파일 선택 */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Excel 파일 선택
          </label>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            disabled={isUploading}
            className="input w-full"
          />
          <p className="text-sm text-gray-300 mt-2">
            최대 파일 크기: 10MB | 형식: .xlsx, .xls
          </p>
        </div>

        {/* 미리보기 */}
        {previewData && (
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">미리보기</h3>
            <div className="bg-gray-800 rounded p-4 overflow-x-auto">
              <p className="text-sm text-gray-300 mb-3">
                {previewData.hasMore
                  ? `처음 50행 표시 (전체 ${previewData.totalCount}행)`
                  : `전체 ${previewData.totalCount}행`}
              </p>
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left p-2">#</th>
                    <th className="text-left p-2">Room</th>
                    <th className="text-left p-2">Member</th>
                    <th className="text-left p-2">Team</th>
                    {previewData.rows[0]?.team_id && <th className="text-left p-2">Team ID</th>}
                    {previewData.rows[0]?.member_id && <th className="text-left p-2">Member ID</th>}
                  </tr>
                </thead>
                <tbody>
                  {previewData.rows.map((row, index) => (
                    <tr key={index} className="border-b border-gray-800">
                      <td className="p-2 text-gray-300">{index + 1}</td>
                      <td className="p-2 text-white">{row.room || '-'}</td>
                      <td className="p-2 text-white">{row.member || '-'}</td>
                      <td className="p-2 text-white">{row.team || '-'}</td>
                      {previewData.rows[0]?.team_id && <td className="p-2 text-xs text-gray-400">{row.team_id || '-'}</td>}
                      {previewData.rows[0]?.member_id && <td className="p-2 text-xs text-gray-400">{row.member_id || '-'}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 검증 에러 */}
            {validationErrors.length > 0 && (
              <div className="mt-3 p-3 bg-gray-800 border border-red-600/50 rounded">
                <p className="text-red-300 font-medium mb-2">
                  ⚠️ 검증 오류 ({validationErrors.length}개)
                </p>
                <ul className="text-sm text-red-200 space-y-1">
                  {validationErrors.slice(0, 5).map((err, idx) => (
                    <li key={idx}>
                      행 {err.row}: {err.error}
                    </li>
                  ))}
                  {validationErrors.length > 5 && (
                    <li className="text-gray-300">
                      ... 외 {validationErrors.length - 5}개
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* 업로드 버튼 */}
        <div className="flex gap-3">
          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="btn btn-primary"
          >
            {isUploading ? '업로드 중...' : '업로드'}
          </button>
          {file && (
            <button
              onClick={() => {
                setFile(null)
                setPreviewData(null)
                setValidationErrors([])
                setReplaceAll(false)
                setUpdateMerge(false)
              }}
              disabled={isUploading}
              className="btn btn-secondary"
            >
              취소
            </button>
          )}
        </div>

        {/* 업로드 결과 */}
        {uploadResult && (
          <div className="mt-6 p-4 bg-gray-800 border border-green-600/50 rounded">
            <h3 className="text-lg font-medium text-green-300 mb-3">
              ✅ Upload 완료
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {uploadResult.mode === 'replace_all' && (
                <>
                  <div>
                    <span className="text-gray-300">삭제된 방:</span>
                    <span className="ml-2 text-red-300 font-medium">{uploadResult.deleted_rooms || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-300">삭제된 팀:</span>
                    <span className="ml-2 text-red-300 font-medium">{uploadResult.deleted_teams || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-300">삭제된 멤버:</span>
                    <span className="ml-2 text-red-300 font-medium">{uploadResult.deleted_members || 0}</span>
                  </div>
                </>
              )}
              <div>
                <span className="text-gray-300">생성된 방:</span>
                <span className="ml-2 text-green-300 font-medium">{uploadResult.rooms_created || 0}</span>
              </div>
              <div>
                <span className="text-gray-300">스킵된 방:</span>
                <span className="ml-2 text-yellow-300 font-medium">{uploadResult.rooms_skipped || 0}</span>
              </div>
              <div>
                <span className="text-gray-300">생성된 팀:</span>
                <span className="ml-2 text-green-300 font-medium">{uploadResult.teams_created || 0}</span>
              </div>
              {uploadResult.mode === 'update_merge' && (
                <div>
                  <span className="text-gray-300">업데이트된 팀:</span>
                  <span className="ml-2 text-blue-300 font-medium">{uploadResult.teams_updated || 0}</span>
                </div>
              )}
              <div>
                <span className="text-gray-300">스킵된 팀:</span>
                <span className="ml-2 text-yellow-300 font-medium">{uploadResult.teams_skipped || 0}</span>
              </div>
              <div>
                <span className="text-gray-300">생성된 멤버:</span>
                <span className="ml-2 text-green-300 font-medium">{uploadResult.members_created || 0}</span>
              </div>
              {uploadResult.mode === 'update_merge' && (
                <div>
                  <span className="text-gray-300">업데이트된 멤버:</span>
                  <span className="ml-2 text-blue-300 font-medium">{uploadResult.members_updated || 0}</span>
                </div>
              )}
              <div>
                <span className="text-gray-300">스킵된 멤버:</span>
                <span className="ml-2 text-yellow-300 font-medium">{uploadResult.members_skipped || 0}</span>
              </div>
              <div>
                <span className="text-gray-300">처리 시간:</span>
                <span className="ml-2 text-white">{uploadResult.processing_time_ms}ms</span>
              </div>
            </div>

            {uploadResult.errors && uploadResult.errors.length > 0 && (
              <div className="mt-4 p-3 bg-gray-800 border border-red-600/50 rounded">
                <p className="text-red-300 font-medium mb-2">
                  에러 ({uploadResult.errors.length}개)
                </p>
                <ul className="text-sm text-red-200 space-y-1 max-h-40 overflow-y-auto">
                  {uploadResult.errors.map((err, idx) => (
                    <li key={idx}>
                      행 {err.row}: {err.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Export 섹션 */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-6">📤 Data Export</h2>
        <p className="text-gray-300 mb-6">
          전체 방/멤버/팀 데이터를 Excel 파일로 다운로드합니다.
          <br />
          Export한 파일을 수정 후 다시 Import할 수 있습니다.
          <br />
          (경기 데이터는 포함되지 않습니다)
        </p>

        <button
          onClick={handleExport}
          disabled={isExporting}
          className="btn btn-primary"
        >
          {isExporting ? 'Exporting...' : 'Export All Data'}
        </button>

        {exportSuccess && (
          <div className="mt-4 p-3 bg-gray-800 border border-green-600/50 rounded">
            <p className="text-green-300">
              ✅ Export가 완료되었습니다!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
