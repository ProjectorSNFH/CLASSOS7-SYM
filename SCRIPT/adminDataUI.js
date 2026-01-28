let centerData = [];
let isSelectionMode = false;
let editingId = null;

// [1] 초기화: 데이터 로드
async function initAdminData() {
    try {
        centerData = await DataService.fetchData();
        renderAdminData();
    } catch (e) { console.error("Load Error:", e); }
}

// [2] 테이블 렌더링 (체크박스 및 상태 완벽 복구)
function renderAdminData() {
    const tbody = document.getElementById('admin-data-body');
    if (!tbody) return;

    let html = '';
    centerData.forEach(item => {
        const isEdit = (String(item.id) === String(editingId));
        const isNew = item.isNew || false;
        
        html += `
        <tr data-id="${item.id}">
            <td class="col-select">
                <input type="checkbox" class="row-checkbox" value="${item.id}" ${isSelectionMode ? '' : 'disabled'}>
            </td>
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
                        data-id="${item.id}"
                        onclick="UIHelper.handleEditEvent(this)">
                    ${isEdit ? '✔' : '✎'}
                </button>
            </td>
        </tr>`;
    });
    tbody.innerHTML = html;
}

// [3] UI 조작 핸들러
const UIHelper = {
    handleEditEvent(btn) {
        const id = btn.getAttribute('data-id');
        this.handleEdit(id);
    },
    handleEdit(id) {
        if (DataService.isUploading) return;
        const item = centerData.find(d => String(d.id) === String(id));

        if (String(id) === String(editingId)) {
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
    triggerFile() { document.getElementById('hiddenFileInput').click(); }
};

// [4] 선택 모드 및 추가/삭제 기능
function toggleSelectionMode() {
    if (DataService.isUploading) return;
    if (editingId) UIHelper.cancelEditing();
    isSelectionMode = !isSelectionMode;
    
    document.body.classList.toggle('selection-mode', isSelectionMode);
    const delBtn = document.getElementById('deleteBtn');
    if (delBtn) delBtn.style.display = isSelectionMode ? 'inline-block' : 'none';
    
    const toggleBtn = document.getElementById('toggleSelectMode');
    if (toggleBtn) toggleBtn.innerText = isSelectionMode ? "취소" : "선택 모드";
    
    renderAdminData();
}

function addNewData() {
    if (DataService.isUploading || editingId) return;
    if (isSelectionMode) toggleSelectionMode();
    const newId = Date.now();
    centerData.unshift({ id: newId, title: "", fileName: "", isNew: true });
    editingId = newId;
    renderAdminData();
}

// 삭제 기능 복구
async function deleteSelected() {
    const checked = document.querySelectorAll('.row-checkbox:checked');
    if (checked.length === 0) return alert("삭제할 대상을 선택하세요.");
    if (!confirm(`${checked.length}개의 항목을 삭제하시겠습니까?`)) return;

    const ids = Array.from(checked).map(cb => cb.value);
    try {
        await DataService.deleteItems(ids);
        alert("삭제 완료");
        location.reload();
    } catch (e) { alert("삭제 실패"); }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        DataService.selectedFile = file;
        const display = document.getElementById('file-name-display');
        if (display) display.innerText = file.name;
    }
}

window.addEventListener('load', initAdminData);