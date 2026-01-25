/* -------------------------------------------------------------------------- */
/* 데이터 센터 로직                                                            */
/* -------------------------------------------------------------------------- */

let currentSort = { column: 'date', ascending: false };
let searchQuery = ""; 
let fileData = [];

const DATA_SERVER_URL = "https://classos7-dx.vercel.app"; 

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    if(searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase();
            renderFileList(); 
        });
    }

    // [추가] 1분 타임아웃 설정
    const loadTimeout = setTimeout(() => {
        const overlay = document.getElementById('loading-overlay');
        const text = document.getElementById('loading-text');
        if (overlay && overlay.style.display !== 'none') {
            overlay.classList.add('loading-failed');
            if (text) text.innerText = "데이터 로딩 실패 : 서버 대기 시간 1분을 초과하였습니다. 인터넷 연결을 확인하세요.";
            setTimeout(() => {
                overlay.style.opacity = '0';
                setTimeout(() => overlay.style.display = 'none', 500);
            }, 3000);
        }
    }, 60000);

    fetchFileData(loadTimeout);
});

async function fetchFileData(loadTimeout) {
    const overlay = document.getElementById('loading-overlay');
    try {
        const response = await fetch(`${DATA_SERVER_URL}/api/auth/import?target=datacenter`);
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        fileData = data;
        
        clearTimeout(loadTimeout); // 성공 시 타임아웃 취소
    } catch (error) {
        clearTimeout(loadTimeout);
        console.error("데이터 로딩 실패:", error);
        fileData = [{ 
            id: 0, uploader: "", title: "불러오기 실패", fileName: "", fileLink: "#", date: "----.--.--" 
        }];
        
        const text = document.getElementById('loading-text');
        if (overlay) {
            overlay.classList.add('loading-failed');
            if (text) text.innerText = "서버 연결 실패 : 오류이거나 서버가 점검 중일 수도 있습니다.";
        }
    } finally {
        sortData(currentSort.column, true);
        
        // 로딩 화면 제거
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.style.display = 'none', 500);
        }
    }
}

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
        let valA = a[column] || "";
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
    for (const key in icons) { if (icons[key]) icons[key].innerText = '↕'; }

    const currentBtn = document.querySelector(`button[onclick="sortData('${currentSort.column}')"]`);
    if (currentBtn) {
        currentBtn.classList.add('active-sort');
        const iconId = `sort-${currentSort.column}-icon`;
        const iconEl = document.getElementById(iconId);
        if (iconEl) iconEl.innerText = currentSort.ascending ? '↑' : '↓';
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
                ${item.fileName ? `<a href="${item.fileLink}" target="_blank" class="file-link" download>${item.fileName}</a>` : ''}
            </div>
            <div class="col-date desktop-only">${item.date.replaceAll('-', '.')}</div>
        </div>
    `).join('');
}