let centerData = [];
let isSelectionMode = false;
let editingId = null;

// [1] 데이터 로드 로직
async function initAdminData() {
    console.log("데이터 로딩 시작...");
    try {
        // DataService 객체의 fetchData 함수 호출
        centerData = await DataService.fetchData();
        console.log("로드 성공:", centerData);
        renderAdminData();
    } catch (e) {
        console.error("데이터 로딩 중 치명적 오류:", e);
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

function addNewData() {
    if (DataService.isUploading || editingId) return;
    const newId = Date.now();
    centerData.unshift({ id: newId, title: "", fileName: "", isNew: true });
    editingId = newId;
    renderAdminData();
}

window.addEventListener('load', initAdminData);