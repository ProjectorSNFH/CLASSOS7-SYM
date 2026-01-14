let currentSort = { column: 'date', ascending: true };
let searchQuery = "";
let showCompleted = true;

// [수정] 데이터 서버의 실제 Vercel 주소를 입력하세요.
const DATA_SERVER_URL = "https://classos-7-nx.vercel.app"; 

// [수정] 더미 데이터 삭제, 서버 데이터를 담을 빈 배열로 초기화
let boardData = [];

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const completedCheckbox = document.getElementById('showCompleted');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase();
            renderBoard();
        });
    }

    if (completedCheckbox) {
        completedCheckbox.addEventListener('change', (e) => {
            showCompleted = e.target.checked;
            renderBoard();
        });
    }

    // [추가] 페이지 로드 시 서버에서 데이터를 가져옵니다.
    fetchBoardData();
});

// [추가] 서버에서 데이터를 가져오는 함수
async function fetchBoardData() {
    try {
        // [중요] 외부 서버이므로 전체 주소를 사용합니다.
        const response = await fetch(`${DATA_SERVER_URL}/api/auth/import?target=board`);
        
        if (!response.ok) throw new Error('서버 응답 오류');
        
        const data = await response.json();
        boardData = data;
    } catch (error) {
        console.error("데이터 로딩 실패:", error);
        // [요청사항] 실패 시 표시할 에러 데이터 생성
        boardData = [
            { id: 0, title: "불러오기 실패", date: "0000-00-00", category: "오류" }
        ];
    } finally {
        // 로딩 완료(또는 실패) 후 정렬 및 화면 렌더링
        sortData(currentSort.column, true);
    }
}

function calculateDDay(targetDate) {
    if (targetDate === "0000-00-00") return 0;
    const today = new Date();
    today.setHours(0,0,0,0);
    const target = new Date(targetDate);
    const diff = target - today;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function renderBoard() {
    const container = document.getElementById('board-list-container');
    if (!container) return;

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
        
        // [수정] 실패 데이터(id:0)인 경우 D-Day 텍스트 처리
        const dDayText = item.id === 0 ? "-" : (dDayCount === 0 ? "D-Day" : (dDayCount > 0 ? `D-${dDayCount}` : `D+${Math.abs(dDayCount)}`));
        const dateText = item.date === "0000-00-00" ? "--/--" : item.date.split('-').slice(1).join('/');

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

    if (filteredData.length === 0 && boardData.length !== 0) {
        container.innerHTML = `<div style="text-align:center; padding: 40px; color: #666;">검색 결과가 없습니다.</div>`;
    }
}

// 정렬 및 UI 업데이트 함수 (기존 로직 유지)
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

    updateSortUI();
    renderBoard();
}


function updateSortUI() {
    const titleBtn = document.getElementById('sort-title-btn');
    const dateBtn = document.getElementById('sort-date-btn');
    const titleIcon = document.getElementById('sort-title-icon');
    const dateIcon = document.getElementById('sort-date-icon');

    if (!titleBtn || !dateBtn) return;

    titleBtn.classList.remove('active-sort');
    dateBtn.classList.remove('active-sort');
    if (titleIcon) titleIcon.innerText = '↕';
    if (dateIcon) dateIcon.innerText = '↕';

    if (currentSort.column === 'title') {
        titleBtn.classList.add('active-sort');
        if (titleIcon) titleIcon.innerText = currentSort.ascending ? '↑' : '↓';
    } else if (currentSort.column === 'date') {
        dateBtn.classList.add('active-sort');
        if (dateIcon) dateIcon.innerText = currentSort.ascending ? '↑' : '↓';
    }
}