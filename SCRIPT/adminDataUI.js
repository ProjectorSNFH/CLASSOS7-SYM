let centerData = [];
let isSelectionMode = false;
let editingId = null;

async function initAdminData() {
    try {
        centerData = await DataService.fetchData();
        renderAdminData();
    } catch (e) { console.error("Load Error"); }
}

function renderAdminData() {
    const tbody = document.getElementById('admin-data-body');
    if (!tbody) return;

    let html = '';
    centerData.forEach(item => {
        const isEdit = (String(item.id) === String(editingId));
        const isNew = item.isNew || false;
        
        html += `
        <tr data-id="${item.id}">
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
                        data-id="${item.id}"
                        onclick="UIHelper.handleEditEvent(this)">
                    ${isEdit ? '✔' : '✎'}
                </button>
            </td>
        </tr>`;
    });
    tbody.innerHTML = html;
}

const UIHelper = {
    // 버튼 자체를 인자로 받아 data-id를 읽음 (SyntaxError 방지)
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
    if (DataService.isUploading || editingId) return;
    if (isSelectionMode) toggleSelectionMode();
    const newId = Date.now();
    centerData.unshift({ id: newId, title: "", fileName: "", isNew: true });
    editingId = newId;
    renderAdminData();
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