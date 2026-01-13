/* adminBoard.js */
let boardData = [
    { id: 1, title: "수학: 미분과 적분 단원평가", date: "2025-05-15", isEditing: false },
    { id: 2, title: "영어: 영미문학 에세이 제출", date: "2025-05-20", isEditing: false },
    { id: 3, title: "과학: 화학 반응 실험 보고서", date: "2025-05-10", isEditing: false }
];

let isSelectionMode = false;
let editingId = null; // 현재 수정 중인 항목의 ID

document.addEventListener('DOMContentLoaded', renderAdminBoard);

function renderAdminBoard() {
    const tbody = document.getElementById('admin-board-body');
    tbody.innerHTML = boardData.map(item => `
        <tr data-id="${item.id}">
            <td class="col-select">
                <input type="checkbox" class="row-checkbox" value="${item.id}">
            </td>
            <td class="col-content">
                ${item.isEditing 
                    ? `<input type="text" class="edit-input" value="${item.title}" id="input-t-${item.id}">` 
                    : `<span>${item.title}</span>`}
            </td>
            <td class="col-date">
                ${item.isEditing 
                    ? `<input type="date" class="edit-input" value="${item.date}" id="input-d-${item.id}">` 
                    : `<span>${item.date}</span>`}
            </td>
            <td class="col-manage">
                <button class="edit-icon-btn ${item.isEditing ? 'save-icon-btn' : ''}" 
                        onclick="toggleEdit(${item.id})" 
                        ${isSelectionMode && !item.isEditing ? 'disabled style="opacity:0.3"' : ''}>
                    ${item.isEditing ? '✔' : '✎'}
                </button>
            </td>
        </tr>
    `).join('');
}

function toggleSelectionMode() {
    // 1. 수정 중이면 수정 취소
    if (editingId !== null) {
        cancelEditing();
    }

    isSelectionMode = !isSelectionMode;
    updateSelectionUI();
}

function updateSelectionUI() {
    const body = document.body;
    const toggleBtn = document.getElementById('toggleSelectMode');
    const deleteBtn = document.getElementById('deleteBtn');

    if (isSelectionMode) {
        body.classList.add('selection-mode');
        toggleBtn.innerText = "선택 모드 취소";
        deleteBtn.style.display = "inline-block";
    } else {
        body.classList.remove('selection-mode');
        toggleBtn.innerText = "선택 모드";
        deleteBtn.style.display = "none";
        // 체크박스 해제
        document.querySelectorAll('.row-checkbox').forEach(cb => cb.checked = false);
    }
    renderAdminBoard();
}

function toggleEdit(id) {
    const item = boardData.find(d => d.id === id);

    // 저장 로직
    if (item.isEditing) {
        const newTitle = document.getElementById(`input-t-${id}`).value;
        const newDate = document.getElementById(`input-d-${id}`).value;
        if (!newTitle.trim()) return alert("내용을 입력하세요.");
        item.title = newTitle;
        item.date = newDate;
        item.isEditing = false;
        item.isNew = false;
        editingId = null;
    } else {
        // 2. 다른 거 수정 중이었으면 취소
        if (editingId !== null) cancelEditing();
        // 3. 선택 모드였으면 해제
        if (isSelectionMode) {
            isSelectionMode = false;
            updateSelectionUI();
        }
        item.isEditing = true;
        editingId = id;
    }
    renderAdminBoard();
}

function cancelEditing() {
    boardData = boardData.filter(item => !item.isNew); // 새로 만들던 거면 삭제
    boardData.forEach(item => item.isEditing = false);
    editingId = null;
}

function addNewRow() {
    if (editingId !== null) cancelEditing(); // 수정 중이면 취소
    if (isSelectionMode) { // 선택 모드면 취소
        isSelectionMode = false;
        updateSelectionUI();
    }

    const newId = Date.now();
    boardData.unshift({ id: newId, title: "", date: "", isEditing: true, isNew: true });
    editingId = newId;
    renderAdminBoard();
}

function deleteSelected() {
    const checkedBoxes = document.querySelectorAll('.row-checkbox:checked');
    if (checkedBoxes.length === 0) return alert("삭제할 항목을 선택해주세요.");
    if (confirm("삭제하시겠습니까?")) {
        const idsToDelete = Array.from(checkedBoxes).map(cb => parseInt(cb.value));
        boardData = boardData.filter(item => !idsToDelete.includes(item.id));
        renderAdminBoard();
    }
}

function userRoleCheck() {

    const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    };
    const userRole = getCookie("userRole"); // 'A', 'T', 'N'

    if (!userRole === 'B' && !userRole === 'A') {
        window.location.replace("../dashboard.html");
    }
}

userRoleCheck();