/* -------------------------------------------------------------------------- */
/* 데이터 센터 로직                                                            */
/* -------------------------------------------------------------------------- */

// 1. 초기 정렬 및 검색 상태 설정
let currentSort = { column: 'date', ascending: false };
let searchQuery = ""; 

// [수정] 더미 데이터 삭제 후 서버 데이터를 담을 빈 배열 선언
let fileData = [];

// [설정] 데이터 서버의 실제 배포 주소를 입력하세요.
const DATA_SERVER_URL = "https://classos7-dx.vercel.app"; 

document.addEventListener('DOMContentLoaded', () => {
    // 검색창 이벤트 리스너 등록
    const searchInput = document.getElementById('searchInput');
    if(searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase();
            renderFileList(); 
        });
    }

    // [추가] 페이지 로드 시 서버에서 데이터를 가져옵니다.
    fetchFileData();
});

/* -------------------------------------------------------------------------- */
/* 서버 데이터 호출 함수                                                         */
/* -------------------------------------------------------------------------- */

async function fetchFileData() {
    try {
        // Vercel 서버의 datacenter 타겟 호출
        const response = await fetch(`${DATA_SERVER_URL}/api/auth/import?target=datacenter`);
        
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        fileData = data; // 성공 시 데이터 할당
    } catch (error) {
        console.error("데이터 로딩 실패:", error);
        // [요청사항] 실패 시 제목에 "불러오기 실패"가 포함된 빈 데이터 하나 생성
        fileData = [{ 
            id: 0, 
            uploader: "", 
            title: "불러오기 실패", 
            fileName: "", 
            fileLink: "#", 
            date: "----.--.--" 
        }];
    } finally {
        // 로딩 완료 후 초기 정렬 적용 및 렌더링
        sortData(currentSort.column, true);
    }
}

/* -------------------------------------------------------------------------- */
/* 정렬 및 렌더링 함수                                                          */
/* -------------------------------------------------------------------------- */

function sortData(column, isInitial = false) {
    if (!isInitial) {
        if (currentSort.column === column) {
            currentSort.ascending = !currentSort.ascending;
        } else {
            currentSort.column = column;
            currentSort.ascending = (column === 'date') ? false : true; 
        }
    }

    fileData.sort((a, b) => {
        let valA = a[column] || ""; // 값이 없을 경우 빈 문자열 처리
        let valB = b[column] || "";

        if (valA < valB) return currentSort.ascending ? -1 : 1;
        if (valA > valB) return currentSort.ascending ? 1 : -1;
        return 0;
    });

    updateSortUI();
    renderFileList(); 
}

function updateSortUI() {
    const icons = {
        uploader: document.getElementById('sort-uploader-icon'),
        title: document.getElementById('sort-title-icon'),
        date: document.getElementById('sort-date-icon')
    };

    document.querySelectorAll('.sort-controls button').forEach(btn => btn.classList.remove('active-sort'));

    for (const key in icons) {
        if (icons[key]) icons[key].innerText = '↕';
    }

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
    if (!container) return;
    
    const filteredData = fileData.filter(item => {
        if (searchQuery === "") return true;
        const keywords = searchQuery.split(" ").filter(k => k !== "");
        return keywords.every(kw => item.title.toLowerCase().includes(kw));
    });

    if (filteredData.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding: 40px; color: #888;">검색 결과가 없습니다.</div>`;
        return;
    }

    container.innerHTML = filteredData.map(item => `
        <div class="data-item">
            <div class="data-item-meta mobile-only" style="display:none;">
                <span class="col-uploader">${item.uploader}</span>
                <span class="col-date">${item.date.replaceAll('-', '.')}</span>
            </div>

            <div class="col-uploader desktop-only">${item.uploader}</div>
            
            <div class="col-content">
                <span class="content-title">${item.title}</span>
                ${item.fileName ? `
                    <a href="${item.fileLink}" target="_blank" class="file-link" download>
                        ${item.fileName}
                    </a>
                ` : ''}
            </div>
            
            <div class="col-date desktop-only">${item.date.replaceAll('-', '.')}</div>
        </div>
    `).join('');
}