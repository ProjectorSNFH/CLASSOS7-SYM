let centerData = [];
let isSelectionMode = false;
let editingId = null;

async function initAdminData() {
    try {
        centerData = await DataService.fetchData();
        renderAdminData();
    } catch (e) {
        console.error("Data Load Error");
    }
}

function renderAdminData() {
    const tbody = document.getElementById('admin-data-body');
    if (!tbody) return;

    let html = '';
    centerData.forEach(item => {
        const isEdit = (item.id === editingId);
        const isNew = item.isNew || false;
        const isDisabled = (DataService.isUploading || (isSelectionMode && !isEdit));

        html += `<tr data-id="${item.id}">`;
        html += `<td class="col-select"><input type="checkbox" class="row-checkbox" value="${item.id}" data-fileid="${item.fileId}"></td>`;
        html += `<td>${isEdit ? `<input type="text" id="input-${item.id}" class="edit-input" value="${item.title}">` : `<span>${item.title}</span>`}</td>`;
        
        // 수정 모드이면서 '새로 만들기'일 때만 파일 선택 가능
        html += `<td>`;
        if (isEdit && isNew) {
            html += `<button class="control-btn" onclick="UIHelper.openFile()">📁 선택</button> `;
            html += `<span id="file-name-text" style="font-size:12px;">${DataService.selectedFile ? DataService.selectedFile.name : '파일 없음'}</span>`;
        } else {
            html += `<span>${item.fileName || '-'}</span>`;
        }
        html += `</td>`;

        html += `<td style="text-align:center;">`;
        html += `<button class="edit-icon-btn ${isEdit ? 'save-icon-btn' : ''}" onclick="UIHelper.handleEdit(${item.id})" ${isDisabled ? 'disabled style="opacity:0.3"' : ''}>`;
        html += isEdit ? '✔' : '✎';
        html += `</button></td></tr>`;
    });
    tbody.innerHTML = html;
}

const UIHelper = {
    handleEdit(id) {
        if (DataService.isUploading) return;
        const item = centerData.find(d => d.id === id);

        if (item.id === editingId) {
            const titleInput = document.getElementById(`input-${id}`);
            const titleValue = titleInput ? titleInput.value.trim() : "";
            if (!titleValue) return alert("제목을 입력하세요.");
            if (item.isNew && !DataService.selectedFile) return alert("파일을 선택하세요.");
            
            DataService.executeUpload(id, titleValue, item.isNew);
        } else {
            if (isSelectionMode) toggleSelectionMode();
            this.clearEditing();
            editingId = id;
            item.isEditing = true;
            renderAdminData();
        }
    },
    clearEditing() {
        centerData = centerData.filter(i => !i.isNew);
        centerData.forEach(i => i.isEditing = false);
        editingId = null;
        DataService.selectedFile = null;
    },
    openFile() {
        document.getElementById('hiddenFileInput').click();
    }
};

function toggleSelectionMode() {
    if (DataService.isUploading) return;
    if (editingId) UIHelper.clearEditing();
    isSelectionMode = !isSelectionMode;
    document.body.classList.toggle('selection-mode', isSelectionMode);
    document.getElementById('deleteBtn').style.display = isSelectionMode ? 'inline-block' : 'none';
    document.getElementById('toggleSelectMode').innerText = isSelectionMode ? "취소" : "선택 모드";
    renderAdminData();
}

function addNewData() {
    if (DataService.isUploading || editingId) return;
    if (isSelectionMode) toggleSelectionMode();
    const nId = Date.now();
    centerData.unshift({ id: nId, title: "", fileName: "", isEditing: true, isNew: true });
    editingId = nId;
    renderAdminData();
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        DataService.selectedFile = file;
        const text = document.getElementById('file-name-text');
        if (text) text.innerText = file.name;
    }
}

window.onload = initAdminData;