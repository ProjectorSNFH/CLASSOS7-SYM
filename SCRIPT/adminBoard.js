const DATA_SERVER_URL = "https://classos7-dx.vercel.app";
let boardData = []; // 서버에서 받아올 데이터
let isSelectionMode = false;
let editingId = null;

document.addEventListener('DOMContentLoaded', () => {
    // 권한 체크
    const role = getCookie('userRole');
    if (role !== 'A' && role !== 'B') {
        alert("게시판 관리 권한이 없습니다.");
        window.location.href = "admin.html";
        return;
    }
    fetchBoardData(); // 초기 데이터 로드
});

// 데이터 불러오기
async function fetchBoardData() {
    try {
        const res = await fetch(`${DATA_SERVER_URL}/api/auth/import?target=board`);
        const data = await res.json();
        // 서버 데이터에 UI용 속성 추가
        boardData = data.map((item, idx) => ({
            id: item.id || idx + Date.now(),
            title: item.title,
            date: item.date,
            isEditing: false
        }));
        renderAdminBoard();
    } catch (e) { alert("데이터 로딩 실패"); }
}

// [핵심] 서버 저장 로직 (토큰 방식)
async function saveToServer() {
    const userRole = getCookie('userRole');
    try {
        // 1. 토큰 요청
        const tokenRes = await fetch(`${DATA_SERVER_URL}/api/auth/verify`, {
            headers: { 'x-user-role': userRole }
        });
        const { token } = await tokenRes.json();

        if (token === "none") return alert("액세스 권한이 부족합니다.");

        // 2. 데이터 전송
        const response = await fetch(`${DATA_SERVER_URL}/api/auth/write`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-role': userRole },
            body: JSON.stringify({
                target: 'board',
                token: token,
                data: { boardList: boardData } // 현재 boardData 배열 전송
            })
        });

        const result = await response.json();
        if (result.success) {
            alert(result.message);
            fetchBoardData(); // 최신화
        } else {
            alert(result.message);
        }
    } catch (e) { alert("저장 오류: " + e.message); }
}

// ... (상단 생략)

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
                    <input type="text" class="edit-input" value="${item.title}" id="input-t-${item.id}">
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

// ... (이전 코드 생략)

function toggleEdit(id) {
    const item = boardData.find(d => d.id === id);
    if (item.isEditing) {
        // [수정] select 엘리먼트에서 카테고리 값을 확실히 가져옵니다.
        const catEl = document.getElementById(`input-c-${id}`);
        const newCategory = catEl ? catEl.value : "수행"; 
        
        const newTitle = document.getElementById(`input-t-${id}`).value;
        const newDate = document.getElementById(`input-d-${id}`).value;

        if (!newTitle.trim()) return alert("내용을 입력하세요.");
        
        // 데이터 객체 업데이트 (이제 서버로 날아갈 준비 완료!)
        item.category = newCategory; 
        item.title = newTitle;
        item.date = newDate;
        item.isEditing = false;
        editingId = null;

        // 서버 전송 실행
        saveToServer(); 
    } else {
        if (editingId !== null) cancelEditing();
        item.isEditing = true;
        editingId = id;
        renderAdminBoard();
    }
}

// [핵심] 서버 전송 함수: 현재 boardData의 category를 포함한 모든 정보를 전송
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
                // [확인] boardData 배열 안의 category, title, date가 모두 포함되어 날아갑니다.
                data: { boardList: boardData } 
            })
        });

        const result = await response.json();
        if (result.success) {
            alert("게시판 데이터가 성공적으로 저장되었습니다!");
            fetchBoardData(); 
        } else {
            alert("실패: " + result.message);
        }
    } catch (e) { alert("저장 오류: " + e.message); }
}

// addNewRow 함수도 초기 카테고리 값을 설정하도록 수정
function addNewRow() {
    const newId = Date.now();
    boardData.unshift({ id: newId, category: "수행", title: "", date: "", isEditing: true, isNew: true });
    editingId = newId;
    renderAdminBoard();
}

function deleteSelected() {
    const checkedBoxes = document.querySelectorAll('.row-checkbox:checked');
    if (checkedBoxes.length === 0) return alert("삭제할 항목을 선택해주세요.");
    if (confirm("삭제하시겠습니까?")) {
        const idsToDelete = Array.from(checkedBoxes).map(cb => parseInt(cb.value));
        boardData = boardData.filter(item => !idsToDelete.includes(item.id));
        saveToServer(); // 삭제 후 서버 동기화
    }
}

function toggleSelectionMode() {
    isSelectionMode = !isSelectionMode;
    const btn = document.getElementById('toggleSelectMode');
    const delBtn = document.getElementById('deleteBtn');
    document.body.classList.toggle('selection-mode');
    btn.innerText = isSelectionMode ? "선택 모드 취소" : "선택 모드";
    delBtn.style.display = isSelectionMode ? "inline-block" : "none";
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}