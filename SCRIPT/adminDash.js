// adminDataUI.js
let centerData = [];
let isSelectionMode = false;
let editingId = null;

// 초기화
async function initAdminData() {
    try {
        centerData = await DataService.fetchData();
        renderAdminData();
    } catch (e) {
        console.error("초기 로드 실패");
    }
}

// 테이블 렌더링
function renderAdminData() {
    const tbody = document.getElementById('admin-data-body');
    if (!tbody) return;

    let html = '';
    centerData.forEach(item => {
        const isEdit = (item.id === editingId);
        const isNew = item.isNew || false;
        const isDisable = (DataService.isUploading || (isSelectionMode && !isEdit));

        html += `<tr data-id="${item.id}">
            <td class="col-select"><input type="checkbox" class="row-checkbox" value="${item.id}"></td>
            <td>
                ${isEdit ? `<input type="text" id="input-${item.id}" class="edit-input" value="${item.title}">` : `<span>${item.title}</span>`}
            </td>
            <td>
                ${isEdit && isNew 
                    ? `<button class="control-btn" style="padding:2px 8px" onclick="UIHelper.triggerFile()">파일 선택</button>
                       <span id="file-name-display" style="font-size:12px">${DataService.selectedFile ? DataService.selectedFile.name : '선택 전'}</span>` 
                    : `<span>${item.fileName || '-'}</span>`}
            </td>
            <td style="text-align:center">
                <button class="edit-icon-btn ${isEdit ? 'save-icon-btn' : ''}" 
                        onclick="UIHelper.handleEdit(${item.id})" 
                        ${isDisable ? 'disabled style="opacity:0.3"' : ''}>
                    ${isEdit ? '✔' : '✎'}
                </button>
            </td>
        </tr>`;
    });
    tbody.innerHTML = html;
}

const UIHelper = {
    handleEdit(id) {
        if (DataService.isUploading) return;
        const item = centerData.find(d => d.id === id);

        if (id === editingId) {
            const titleInput = document.getElementById(`input-${id}`);
            const titleValue = titleInput ? titleInput.value.trim() : "";
            if (!titleValue) return alert("제목을 입력하세요.");
            if (item.isNew && !DataService.selectedFile) return alert("파일을 선택하세요.");
            
            DataService.executeUpload(id, titleValue, item.isNew);
        } else {
            if (isSelectionMode) toggleSelectionMode();
            this.cancelEditing();
            editingId = id;
            renderAdminData();
        }
    },
    cancelEditing() {
        centerData = centerData.filter(i => !i.isNew);
        editingId = null;
        DataService.selectedFile = null;
    },
    triggerFile() {
        document.getElementById('hiddenFileInput').click();
    }
};

// HTML 버튼들과 연결된 전역 함수들
function toggleSelectionMode() {
    if (DataService.isUploading) return;
    if (editingId) UIHelper.cancelEditing();
    
    isSelectionMode = !isSelectionMode;
    document.body.classList.toggle('selection-mode', isSelectionMode);
    document.getElementById('deleteBtn').style.display = isSelectionMode ? 'inline-block' : 'none';
    document.getElementById('toggleSelectMode').innerText = isSelectionMode ? "취소" : "선택 모드";
    renderAdminData();
}

function addNewData() {
    if (DataService.isUploading || editingId) return alert("작업 중인 항목을 먼저 완료하세요.");
    if (isSelectionMode) toggleSelectionMode();

    const newId = Date.now();
    centerData.unshift({ id: newId, title: "", fileName: "", isNew: true });
    editingId = newId;
    renderAdminData();
}

function deleteSelected() {
    const checked = document.querySelectorAll('.row-checkbox:checked');
    if (checked.length === 0) return alert("삭제할 대상을 선택하세요.");
    const ids = Array.from(checked).map(cb => cb.value);
    DataService.deleteItems(ids);
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        DataService.selectedFile = file;
        const display = document.getElementById('file-name-display');
        if (display) display.innerText = file.name;
    }
}

// 부모 script.js 로드 대기 후 시작
window.addEventListener('load', initAdminData);