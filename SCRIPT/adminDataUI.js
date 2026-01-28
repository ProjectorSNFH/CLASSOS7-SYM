let centerData = [];
let isSelectionMode = false;
let editingId = null;

// [1] 페이지 초기 로드
async function initAdminData() {
    console.log("데이터 로딩 시작...");
    try {
        centerData = await DataService.fetchData();
        console.log("데이터 로딩 완료:", centerData);
        renderAdminData();
    } catch (e) {
        console.error("데이터 로드 중 오류 발생:", e);
    }
}

// [2] 테이블 렌더링
function renderAdminData() {
    const tbody = document.getElementById('admin-data-body');
    if (!tbody) return;

    let html = '';
    centerData.forEach(item => {
        const isEdit = (String(item.id) === String(editingId));
        const isNew = item.isNew || false;
        const isDisabled = (DataService.isUploading || (isSelectionMode && !isEdit));

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
                        onclick="UIHelper.handleEditEvent(this)"
                        ${isDisabled ? 'disabled style="opacity:0.3"' : ''}>
                    ${isEdit ? '✔' : '✎'}
                </button>
            </td>
        </tr>`;
    });
    tbody.innerHTML = html;
}

// [3] UI 이벤트 조작 (UIHelper)
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
    triggerFile() {
        document.getElementById('hiddenFileInput').click();
    }
};

// [4] 상단 공통 버튼 함수
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
    if (DataService.isUploading || editingId) return alert("작업 중인 항목을 완료해 주세요.");
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