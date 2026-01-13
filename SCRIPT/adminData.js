/* adminData.js */

// 초기 더미 데이터
let centerData = [
    { id: 1, title: "1학기 수학 공식 모음집", fileName: "math_formula_v1.pdf", url: "#", isEditing: false, isNew: false },
    { id: 2, title: "영어 단어장 (중간고사 범위)", fileName: "eng_word_list.docx", url: "#", isEditing: false, isNew: false },
    { id: 3, title: "과학 실험 안전 유의사항", fileName: "science_safety.pptx", url: "#", isEditing: false, isNew: false }
];

let isSelectionMode = false;
let editingId = null; 
let currentUploadingId = null;

// 페이지가 로드되자마자 실행되도록 보장
const init = () => {
    console.log("Admin Data 초기화 중...");
    const tbody = document.getElementById('admin-data-body');
    if (tbody) {
        renderAdminData();
    } else {
        // 만약 요소를 못 찾았다면 0.1초 뒤에 다시 시도 (안전장치)
        setTimeout(init, 100);
    }
};

window.onload = init;

function renderAdminData() {
    const tbody = document.getElementById('admin-data-body');
    if (!tbody) return;

    tbody.innerHTML = centerData.map(item => `
        <tr data-id="${item.id}">
            <td class="col-select">
                <input type="checkbox" class="row-checkbox" value="${item.id}">
            </td>
            <td class="col-title">
                ${item.isEditing 
                    ? `<input type="text" class="edit-input" value="${item.title}" id="input-${item.id}" placeholder="제목 입력">` 
                    : `<span>${item.title}</span>`
                }
            </td>
            <td class="col-file">
                ${item.isEditing && item.isNew && !item.fileName 
                    ? `<button class="control-btn" style="padding: 5px 10px; font-size: 0.8rem;" onclick="triggerFileUpload(${item.id})">📁 파일 선택</button>`
                    : `<span class="${item.isEditing ? 'file-link-active' : 'file-link-static'}" 
                             ${item.isEditing ? 'onclick="alertFileNotice()"' : ''}>
                        ${item.fileName || "파일 없음"}
                       </span>`
                }
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

// 모드 전환 및 데이터 제어 함수 (이전과 동일하지만 로직 안정화)
function toggleSelectionMode() {
    if (editingId !== null) cancelEditing();
    isSelectionMode = !isSelectionMode;
    
    const toggleBtn = document.getElementById('toggleSelectMode');
    const deleteBtn = document.getElementById('deleteBtn');

    if (isSelectionMode) {
        document.body.classList.add('selection-mode');
        toggleBtn.innerText = "선택 모드 취소";
        deleteBtn.style.display = "inline-block";
    } else {
        document.body.classList.remove('selection-mode');
        toggleBtn.innerText = "선택 모드";
        deleteBtn.style.display = "none";
        document.querySelectorAll('.row-checkbox').forEach(cb => cb.checked = false);
    }
    renderAdminData();
}

function toggleEdit(id) {
    const item = centerData.find(d => d.id === id);
    
    if (item.isEditing) {
        const inputVal = document.getElementById(`input-${id}`).value;
        if (!inputVal.trim()) return alert("제목을 입력해주세요.");
        if (item.isNew && !item.fileName) return alert("파일을 업로드해주세요.");

        item.title = inputVal;
        item.isEditing = false;
        item.isNew = false;
        editingId = null;
    } else {
        if (editingId !== null) cancelEditing();
        if (isSelectionMode) toggleSelectionMode(); // 선택모드 자동 해제
        
        item.isEditing = true;
        editingId = id;
    }
    renderAdminData();
}

function cancelEditing() {
    centerData = centerData.filter(item => !item.isNew);
    centerData.forEach(item => item.isEditing = false);
    editingId = null;
    renderAdminData();
}

function addNewData() {
    if (editingId !== null) return; // 중복 생성 방지
    if (isSelectionMode) toggleSelectionMode();

    const newId = Date.now();
    centerData.unshift({ 
        id: newId, title: "", fileName: "", isEditing: true, isNew: true 
    });
    editingId = newId;
    renderAdminData();
}

function triggerFileUpload(id) {
    currentUploadingId = id;
    document.getElementById('hiddenFileInput').click();
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file && currentUploadingId) {
        const item = centerData.find(d => d.id === currentUploadingId);
        if (item) {
            item.fileName = file.name;
        }
        renderAdminData();
    }
    event.target.value = '';
}

function deleteSelected() {
    const checkedBoxes = document.querySelectorAll('.row-checkbox:checked');
    if (checkedBoxes.length === 0) return alert("삭제할 항목을 선택해주세요.");

    if (confirm(`${checkedBoxes.length}개의 자료를 삭제하시겠습니까?`)) {
        const idsToDelete = Array.from(checkedBoxes).map(cb => parseInt(cb.value));
        centerData = centerData.filter(item => !idsToDelete.includes(item.id));
        renderAdminData();
    }
}

function alertFileNotice() {
    alert("파일은 수정할 수 없습니다. \n수정하려면 삭제 후 다시 업로드하세요.");
}

function userRoleCheck() {

    const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    };
    const userRole = getCookie("userRole"); // 'A', 'T', 'N'

    if (!userRole === 'A' || !userRole === 'T') {
        window.location.replace("../dashboard.html");
    }
}

userRoleCheck();