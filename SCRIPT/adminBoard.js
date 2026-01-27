const DATA_SERVER_URL = "https://classos7-dx.vercel.app";
let boardData = []; 
let isSelectionMode = false;
let editingId = null;

document.addEventListener('DOMContentLoaded', () => {
    const role = getCookie('userRole');
    if (role !== 'A' && role !== 'B') {
        alert("게시판 관리 권한이 없습니다.");
        window.location.href = "admin.html";
        return;
    }
    fetchBoardData();
});

// 데이터 불러오기 (UI 상태 초기화 포함)
async function fetchBoardData() {
    try {
        const res = await fetch(`${DATA_SERVER_URL}/api/auth/import?target=board`);
        const data = await res.json();
        boardData = data.map((item, idx) => ({
            id: item.id || idx + Date.now(),
            category: item.category || "수행",
            title: item.title,
            date: item.date,
            isEditing: false
        }));
        // 데이터 로드 시 모든 모드 리셋
        editingId = null;
        if(isSelectionMode) toggleSelectionMode(); 
        renderAdminBoard();
    } catch (e) { alert("데이터 로딩 실패"); }
}

// [공통] 수정 취소 함수
function cancelEditing() {
    // 새로 만들던 항목이면 배열에서 제거, 기존 항목이면 상태만 복구
    boardData = boardData.filter(item => !item.isNew);
    boardData.forEach(item => item.isEditing = false);
    editingId = null;
}

// [공통] 선택 모드 강제 종료
function forceExitSelectionMode() {
    if (isSelectionMode) {
        isSelectionMode = false;
        const btn = document.getElementById('toggleSelectMode');
        const delBtn = document.getElementById('deleteBtn');
        document.body.classList.remove('selection-mode');
        if(btn) btn.innerText = "선택 모드";
        if(delBtn) delBtn.style.display = "none";
    }
}

function renderAdminBoard() {
    const tbody = document.getElementById('admin-board-body');
    if (!tbody) return;
    tbody.innerHTML = boardData.map(item => `
        <tr data-id="${item.id}">
            <td class="col-select"><input type="checkbox" class="row-checkbox" value="${item.id}"></td>
            <td class="col-content">
                ${item.isEditing ? `
                    <select class="edit-input" id="input-c-${item.id}" style="width: 80px; margin-bottom: 5px;">
                        <option value="수행" ${item.category === '수행' ? 'selected' : ''}>수행</option>
                        <option value="안내" ${item.category === '안내' ? 'selected' : ''}>안내</option>
                    </select>
                    <input type="text" class="edit-input" value="${item.title}" id="input-t-${item.id}" placeholder="내용 입력">
                ` : `
                    <span class="badge" style="font-size: 0.7rem; color: var(--accent-red); font-weight: bold;">[${item.category || '공지'}]</span>
                    <span>${item.title}</span>
                `}
            </td>
            <td class="col-date">
                ${item.isEditing ? `<input type="date" class="edit-input" value="${item.date}" id="input-d-${item.id}">` : `<span>${item.date}</span>`}
            </td>
            <td class="col-manage">
                <button class="edit-icon-btn ${item.isEditing ? 'save-icon-btn' : ''}" onclick="toggleEdit(${item.id})">
                    ${item.isEditing ? '✔' : '✎'}
                </button>
            </td>
        </tr>
    `).join('');
}

function toggleEdit(id) {
    const item = boardData.find(d => d.id === id);
    
    if (item.isEditing) {
        // 저장 로직
        const newCategory = document.getElementById(`input-c-${id}`).value;
        const newTitle = document.getElementById(`input-t-${id}`).value;
        const newDate = document.getElementById(`input-d-${id}`).value;

        if (!newTitle.trim()) return alert("내용을 입력하세요.");
        
        item.category = newCategory; 
        item.title = newTitle;
        item.date = newDate;
        item.isEditing = false;
        item.isNew = false; // 새 항목 딱지 떼기
        editingId = null;
        saveToServer(); 
    } else {
        // 수정 모드 진입 시: 선택 모드 해제 및 기존 수정 취소
        forceExitSelectionMode();
        if (editingId !== null) cancelEditing();
        
        item.isEditing = true;
        editingId = id;
        renderAdminBoard();
    }
}

function addNewRow() {
    // 1. 이미 새 항목이 수정 중이라면 중복 생성 방지
    if (boardData.some(item => item.isNew)) {
        alert("이미 작성 중인 새 항목이 있습니다.");
        return;
    }

    // 2. 다른 모드들 정리
    forceExitSelectionMode();
    if (editingId !== null) cancelEditing();

    // 3. 새 항목 추가
    const newId = Date.now();
    boardData.unshift({ 
        id: newId, 
        category: "수행", 
        title: "", 
        date: new Date().toISOString().split('T')[0], 
        isEditing: true, 
        isNew: true 
    });
    editingId = newId;
    renderAdminBoard();
}

function toggleSelectionMode() {
    // 선택 모드 켤 때 수정 중이던 게 있다면 취소
    if (!isSelectionMode) {
        if (editingId !== null) cancelEditing();
    }
    
    isSelectionMode = !isSelectionMode;
    const btn = document.getElementById('toggleSelectMode');
    const delBtn = document.getElementById('deleteBtn');
    document.body.classList.toggle('selection-mode');
    
    if(btn) btn.innerText = isSelectionMode ? "선택 모드 취소" : "선택 모드";
    if(delBtn) delBtn.style.display = isSelectionMode ? "inline-block" : "none";
    renderAdminBoard();
}

async function saveToServer() {
    const userRole = getCookie('userRole');
    try {
        const tokenRes = await fetch(`${DATA_SERVER_URL}/api/auth/verify`, {
            headers: { 'x-user-role': userRole }
        });
        const { token } = await tokenRes.json();
        if (token === "none") return alert("액세스 권한 부족");

        const response = await fetch(`${DATA_SERVER_URL}/api/auth/write`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-role': userRole },
            body: JSON.stringify({
                target: 'board',
                token: token,
                data: { boardList: boardData.filter(item => !item.isNew || !item.isEditing) } 
            })
        });

        const result = await response.json();
        if (result.success) {
            alert("저장되었습니다!");
            fetchBoardData(); 
        }
    } catch (e) { alert("저장 오류: " + e.message); }
}

function deleteSelected() {
    const checkedBoxes = document.querySelectorAll('.row-checkbox:checked');
    if (checkedBoxes.length === 0) return alert("삭제할 항목을 선택해주세요.");
    if (confirm("삭제하시겠습니까?")) {
        const idsToDelete = Array.from(checkedBoxes).map(cb => parseInt(cb.value));
        boardData = boardData.filter(item => !idsToDelete.includes(item.id));
        saveToServer();
    }
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}