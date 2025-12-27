/**
 * mealtable.js - 나이스 급식 API 연동 및 렌더링
 */

document.addEventListener('DOMContentLoaded', () => {
    fetchMealData();
});

async function fetchMealData() {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const formatDate = (date) => {
        return date.getFullYear() + 
               String(date.getMonth() + 1).padStart(2, '0') + 
               String(date.getDate()).padStart(2, '0');
    };

    // 실제 사용 시 아래 API 주소와 본인의 인증키를 연동하세요.
    // 현재는 작동 구조를 보여드리기 위한 모의 함수(Mock)를 실행합니다.
    const todayStr = formatDate(today);
    const tomorrowStr = formatDate(tomorrow);

    renderMeal('today-meal', await getMealMock(todayStr));
    renderMeal('tomorrow-meal', await getMealMock(tomorrowStr));
}

// 급식 데이터를 줄바꿈하여 렌더링하는 함수
function renderMeal(elementId, mealData) {
    const container = document.getElementById(elementId);
    if (!mealData || mealData.length === 0) {
        container.innerHTML = "급식 정보가 없습니다.";
        return;
    }

    // 메뉴 문자열을 받아 특수문자/숫자 제거 및 줄바꿈 처리
    // 나이스 API는 메뉴가 "밥(5.13.)" 형태로 오기 때문에 가공이 필요함
    container.innerHTML = mealData.map(item => 
        `<span class="meal-item">${item.replace(/[0-9.()]/g, '')}</span>`
    ).join('');
}

// 나이스 API 대용 데이터 (테스트용)
async function getMealMock(dateStr) {
    // 실제 연동 시에는 fetch(`https://open.neis.go.kr/hub/mealServiceDietInfo?...`) 사용
    const mockData = {
        "20251221": ["현미밥", "쇠고기미역국(16.)", "안동찜닭(2.5.6.13.15.)", "배추겉절이(9.13.)", "사과"],
        "20251222": ["차수수밥", "해물순두부찌개(1.5.6.9.13.18.)", "돈육불고기(5.6.10.13.)", "깍두기(9.13.)", "요구르트(2.)"]
    };
    
    // 현재 시간(2025년 12월 21일 기준)으로 데이터 반환
    return mockData[dateStr] || ["급식 정보가 없습니다."];
}