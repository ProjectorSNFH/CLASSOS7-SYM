/**
 * mealtable.js - 나이스 오픈 API 연동 급식표 로직
 */

// [설정] 본인 학교의 정보를 입력하세요. (나이스 오픈 API에서 확인 가능)
const MEAL_CONFIG = {
    KEY: 'YOUR_NEIS_API_KEY', // 나이스 API 키가 없다면 공백으로 두어도 동작은 하나 제한이 있을 수 있음
    ATPT_OFCDC_SC_CODE: 'B10', // 시도교육청코드 (예: 서울 B10, 경기 J10)
    SD_SCHUL_CODE: '7011489',   // 행정표준기관코드 (7자리 숫자)
};

document.addEventListener('DOMContentLoaded', () => {
    // 오늘과 내일 날짜 생성 (YYYYMMDD 형식)
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    };

    // 급식 데이터 호출 및 렌더링
    fetchMeal(formatDate(today), 'today-meal');
    fetchMeal(formatDate(tomorrow), 'tomorrow-meal');
});

/**
 * 나이스 API에서 급식 데이터를 가져오는 함수
 * @param {string} date - YYYYMMDD 형식의 날짜
 * @param {string} targetId - 데이터를 넣을 HTML 요소의 ID
 */
async function fetchMeal(date, targetId) {
    const container = document.getElementById(targetId);
    const url = `https://open.neis.go.kr/hub/mealServiceDietInfo?Type=json&ATPT_OFCDC_SC_CODE=${MEAL_CONFIG.ATPT_OFCDC_SC_CODE}&SD_SCHUL_CODE=${MEAL_CONFIG.SD_SCHUL_CODE}&MLSV_YMD=${date}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        // 데이터가 없는 경우 (주말, 방학 등)
        if (data.RESULT && data.RESULT.CODE === "INFO-200") {
            container.innerHTML = `<div style="color: #888; font-size: 0.9rem;">급식 정보가 없습니다.</div>`;
            return;
        }

        // 급식 메뉴 추출 및 가공
        // 나이스 데이터는 메뉴 뒤에 알레르기 정보(숫자)가 붙어 있으므로 정규식으로 제거
        let dishContent = data.mealServiceDietInfo[1].row[0].DDISH_NM;
        dishContent = dishContent
            .replace(/\([^)]*\)/g, '')   // 괄호와 그 안의 숫자 제거
            .replace(/\*/g, '')          // 별표 제거
            .split('<br/>')              // 줄바꿈 태그 분리
            .map(item => item.trim())    // 공백 제거
            .filter(item => item !== "") // 빈 줄 제거
            .join(', ');                 // 다시 쉼표로 연결 (디자인에 따라 조절)

        // 칼로리 정보 추가
        const kcal = data.mealServiceDietInfo[1].row[0].CAL_INFO;

        container.innerHTML = `
            <div style="font-size: 1rem; line-height: 1.6; color: var(--text-color);">
                ${dishContent}
            </div>
            <div style="margin-top: 8px; font-size: 0.8rem; color: #888; font-family: 'JetBrains Mono';">
                ${kcal}
            </div>
        `;

    } catch (error) {
        console.error("급식 데이터 호출 실패:", error);
        container.innerHTML = `<div style="color: var(--accent-red); font-size: 0.9rem;">데이터를 불러오지 못했습니다.</div>`;
    }
}