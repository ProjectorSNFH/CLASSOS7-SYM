/* -------------------------------------------------------------------------- */
/* 데이터 센터 로직                                                            */
/* -------------------------------------------------------------------------- */

// 1. 초기 정렬 상태: 'date' 기준 내림차순 (최신순)
let currentSort = { column: 'date', ascending: false };
let searchQuery = ""; // [추가] 검색어 저장 변수

// 더미 데이터
const fileData = [
    { 
        id: 1, 
        uploader: "선생님", 
        title: "1학기 수업 계획서 및 평가 기준", 
        fileName: "2024_syllabus.pdf", 
        fileLink: "https://google.com", 
        date: "2024-03-02" 
    },
    { 
        id: 2, 
        uploader: "수학부장", 
        title: "미적분 기출문제 모음집 (2020-2023)", 
        fileName: "calculus_past_questions.zip", 
        fileLink: "https://google.com", 
        date: "2024-04-10" 
    },
    { 
        id: 3, 
        uploader: "과학선생님", 
        title: "화학 실험실 안전 교육 자료", 
        fileName: "lab_safety_guide.pptx", 
        fileLink: "https://google.com", 
        date: "2024-03-15" 
    },
    { 
        id: 4, 
        uploader: "선생님", 
        title: "현장체험학습 가정통신문", 
        fileName: "field_trip_notice.hwp", 
        fileLink: "https://google.com", 
        date: "2024-05-01" 
    },
    { 
        id: 5, 
        uploader: "영어부장", 
        title: "영어 듣기 평가 MP3 파일", 
        fileName: "listening_test_vol1.mp3", 
        fileLink: "https://google.com", 
        date: "2024-04-20" 
    }
];

document.addEventListener('DOMContentLoaded', () => {
    // [추가] 검색창 이벤트 리스너 등록
    const searchInput = document.getElementById('searchInput');
    if(searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase(); // 소문자로 변환해 저장
            renderFileList(); // 화면 갱신
        });
    }

    // 페이지 로드 시 초기 정렬 적용 (작성일 내림차순)
    sortData('date', true);
});

/* -------------------------------------------------------------------------- */
/* 정렬 및 렌더링 함수                                                          */
/* -------------------------------------------------------------------------- */

function sortData(column, isInitial = false) {
    // 1. 정렬 방향 설정
    if (!isInitial) {
        if (currentSort.column === column) {
            currentSort.ascending = !currentSort.ascending; // 같은 컬럼이면 방향 반전
        } else {
            currentSort.column = column;
            // 컬럼이 바뀌면 기본 정렬 방향 설정
            // 날짜는 기본 내림차순(최신순), 나머지는 오름차순(가나다순)
            currentSort.ascending = (column === 'date') ? false : true; 
        }
    }

    // 2. 데이터 정렬 실행 (원본 배열 정렬)
    fileData.sort((a, b) => {
        let valA = a[column];
        let valB = b[column];

        if (valA < valB) return currentSort.ascending ? -1 : 1;
        if (valA > valB) return currentSort.ascending ? 1 : -1;
        return 0;
    });

    // 3. UI 업데이트
    updateSortUI();
    renderFileList(); // 정렬된 상태에서 렌더링 (검색 필터 적용됨)
}

function updateSortUI() {
    // 모든 아이콘 초기화
    const icons = {
        uploader: document.getElementById('sort-uploader-icon'),
        title: document.getElementById('sort-title-icon'),
        date: document.getElementById('sort-date-icon')
    };

    // 버튼 활성화 상태 초기화
    document.querySelectorAll('.sort-controls button').forEach(btn => btn.classList.remove('active-sort'));

    for (const key in icons) {
        if (icons[key]) icons[key].innerText = '↕';
    }

    // 현재 정렬된 버튼 스타일 및 아이콘 변경
    const currentBtn = document.querySelector(`button[onclick="sortData('${currentSort.column}')"]`);
    if (currentBtn) {
        currentBtn.classList.add('active-sort');
        const iconId = `sort-${currentSort.column}-icon`;
        const iconEl = document.getElementById(iconId);
        if (iconEl) {
            iconEl.innerText = currentSort.ascending ? '↑' : '↓';
        }
    }
}

function renderFileList() {
    const container = document.getElementById('file-list-container');
    
    // [수정] 렌더링 전 검색어 필터링 수행
    const filteredData = fileData.filter(item => {
        if (searchQuery === "") return true; // 검색어 없으면 전체 표시

        // 공백 기준으로 검색어 분리 (AND 조건 검색)
        const keywords = searchQuery.split(" ").filter(k => k !== "");
        return keywords.every(kw => item.title.toLowerCase().includes(kw));
    });

    // 결과 없음 처리
    if (filteredData.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding: 40px; color: #888;">검색 결과가 없습니다.</div>`;
        return;
    }

    // 필터링된 데이터(filteredData)로 목록 생성
    container.innerHTML = filteredData.map(item => `
        <div class="data-item">
            <div class="data-item-meta mobile-only" style="display:none;">
                <span class="col-uploader">${item.uploader}</span>
                <span class="col-date">${item.date.replaceAll('-', '.')}</span>
            </div>

            <div class="col-uploader desktop-only">${item.uploader}</div>
            
            <div class="col-content">
                <span class="content-title">${item.title}</span>
                <a href="${item.fileLink}" target="_blank" class="file-link" download>
                    ${item.fileName}
                </a>
            </div>
            
            <div class="col-date desktop-only">${item.date.replaceAll('-', '.')}</div>
        </div>
    `).join('');
}