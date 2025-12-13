/**
 * 시간 포맷팅 유틸리티 (한국 시간대 기준)
 */

/**
 * ISO 날짜 문자열을 한국 시간으로 포맷팅
 * @param {string} dateString - ISO 형식의 날짜 문자열
 * @param {object} options - Intl.DateTimeFormat 옵션
 * @returns {string} 포맷팅된 시간 문자열
 */
export const formatKST = (dateString, options = {}) => {
  if (!dateString) return '-'

  const date = new Date(dateString)

  const defaultOptions = {
    timeZone: 'Asia/Seoul',
    hour12: false,
    ...options
  }

  return date.toLocaleString('ko-KR', defaultOptions)
}

/**
 * 시간만 표시 (HH:MM 형식, 한국 시간대)
 */
export const formatTimeKST = (dateString) => {
  return formatKST(dateString, {
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * 날짜와 시간 표시 (YYYY. MM. DD. HH:MM 형식, 한국 시간대)
 */
export const formatDateTimeKST = (dateString) => {
  if (!dateString) return '-'

  const date = new Date(dateString)

  // 한국 시간대로 변환
  const kstString = date.toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })

  // "YYYY. MM. DD. HH:MM" 형식으로 변환 (초 제거)
  return kstString.replace(/:\d{2}$/, '')
}

/**
 * 날짜만 표시 (YYYY. MM. DD. 형식, 한국 시간대)
 */
export const formatDateKST = (dateString) => {
  return formatKST(dateString, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}
