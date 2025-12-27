let currentSort = { column: 'date', ascending: true };
let searchQuery = "";
let showCompleted = true;

// 더미 데이터 (이미 지난 날짜 포함)
const boardData = [
    { id: 1, title: "수학: 미분과 적분 단원평가", date: "2026-05-15", category: "수행" },
    { id: 2, title: "영어: 영미문학 에세이 제출", date: "2026-05-20", category: "과제" },
    { id: 3, title: "과학: 화학 반응 실험 보고서", date: "2026-05-10", category: "수행" }, // 마감됨
    { id: 4, title: "국어: 현대시 분석 발표", date: "2025-01-25", category: "발표" },
    { id: 5, title: "체육: 배드민턴 실기 테스트", date: "2026-04-18", category: "수행" }  // 마감됨
];

document.addEventListener('DOMContentLoaded', () => {
    // 이벤트 리스너 등록
    const searchInput = document.getElementById('searchInput');
    const completedCheckbox = document.getElementById('showCompleted');

    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        renderBoard();
    });

    completedCheckbox.addEventListener('change', (e) => {
        showCompleted = e.target.checked;
        renderBoard();
    });

    sortData(currentSort.column, true);
});

function calculateDDay(targetDate) {
    const today = new Date();
    today.setHours(0,0,0,0);
    const target = new Date(targetDate);
    const diff = target - today;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function renderBoard() {
    const container = document.getElementById('board-list-container');
    const today = new Date();
    today.setHours(0,0,0,0);

    const filteredData = boardData.filter(item => {
        const isPast = new Date(item.date) < today;
        if (!showCompleted && isPast) return false;
        const keywords = searchQuery.split(" ").filter(k => k !== "");
        return keywords.every(kw => item.title.toLowerCase().includes(kw));
    });

    container.innerHTML = filteredData.map(item => {
        const dDayCount = calculateDDay(item.date);
        const isPast = dDayCount < 0;
        const dDayText = dDayCount === 0 ? "D-Day" : (dDayCount > 0 ? `D-${dDayCount}` : `D+${Math.abs(dDayCount)}`);
        
        // 날짜 포맷 (MM/DD)
        const dateText = item.date.split('-').slice(1).join('/');

        return `
            <div class="board-item ${isPast ? 'completed' : ''}">
                <div class="col-title">
                    <span class="category-tag">[${item.category}]</span>
                    ${item.title}
                </div>
                <div class="col-date">
                    <div class="date-wrapper">
                        <span class="date-val">${dateText}</span>
                        <span class="mobile-until">까지</span>
                        <span class="d-day-tag" style="${isPast ? 'color: #666;' : ''}">${dDayText}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    if (filteredData.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding: 40px; color: #666;">검색 결과가 없습니다.</div>`;
    }
}

// 정렬 함수 (기존과 동일)
function sortData(column, isInitial = false) {
    if (!isInitial) {
        if (currentSort.column === column) {
            currentSort.ascending = !currentSort.ascending;
        } else {
            currentSort.column = column;
            currentSort.ascending = true;
        }
    }

    boardData.sort((a, b) => {
        let valA = a[column];
        let valB = b[column];
        return currentSort.ascending ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });

    updateSortUI(); // 아이콘과 버튼 스타일을 한꺼번에 업데이트
    renderBoard();
}

function updateSortUI() {
    const titleBtn = document.getElementById('sort-title-btn');
    const dateBtn = document.getElementById('sort-date-btn');
    const titleIcon = document.getElementById('sort-title-icon');
    const dateIcon = document.getElementById('sort-date-icon');

    // 1. 클래스 초기화
    titleBtn.classList.remove('active-sort');
    dateBtn.classList.remove('active-sort');
    titleIcon.innerText = '↕';
    dateIcon.innerText = '↕';

    // 2. 현재 활성화된 버튼에 스타일 및 아이콘 적용
    if (currentSort.column === 'title') {
        titleBtn.classList.add('active-sort');
        titleIcon.innerText = currentSort.ascending ? '↑' : '↓';
    } else if (currentSort.column === 'date') {
        dateBtn.classList.add('active-sort');
        dateIcon.innerText = currentSort.ascending ? '↑' : '↓';
    }
}