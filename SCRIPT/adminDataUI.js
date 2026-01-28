/**
 * adminDataUI.js
 * 기능: UI 렌더링 및 모드 제어 (중복 간섭 차단)
 */

let centerData = [];
let isSelectionMode = false;
let editingId = null;

// [1] 초기 데이터 로드
async function initAdminData() {
    try {
        // DataService는 adminDataSV.js에 정의됨
        centerData = await DataService.fetchData(); 
        renderAdminData();
    } catch (e) {
        console.error("데이터 로드 중 오류:", e);
    }
}

// [2] 테이블 렌더링 (SyntaxError 방지를 위해 문자열 조립 최적화)
function renderAdminData() {
    const tbody = document.getElementById('admin-data-body');
    if (!tbody) return;

    let html = "";
    centerData.forEach(item => {
        const isEdit = item.isEditing;
        const isNew = item.isNew;
        
        // 버튼 활성화 상태 계산
        const isBtnDisabled = (isSelectionMode || DataService.isUploading) && !isEdit;
        const disabledAttr = isBtnDisabled ? 'disabled style="opacity:0.3"' : '';
        const btnClass = isEdit ? 'edit-icon-btn save-icon-btn' : 'edit-icon-btn';
        const btnIcon = isEdit ? '✔' : '✎';

        html += `
        <tr data-id="${item.id}">
            <td class="col-select">
                <input type="checkbox" class="row-checkbox" value="${item.id}">
            </td>
            <td class="col-title">
                ${isEdit 
                    ? `<input type="text" class="edit-input" id="input-${item.id}" value="${item.title}">` 
                    : `<span>${item.title}</span>`}
            </td>
            <td class="col-file">
                ${isEdit && isNew 
                    ? `<button class="control-btn" onclick="UIHelper.triggerFile()">📁 선택</button>
                       <span id="fileNameDisplay" style="font-size:0.8rem;">${DataService.selectedFile ? DataService.selectedFile.name : '파일 없음'}</span>`
                    : `<span>${item.fileName || ''}</span>`}
            </td>
            <td class="col-manage">
                <button class="${btnClass}" onclick="UIHelper.handleEditClick(${item.id})" ${disabledAttr}>
                    ${btnIcon}
                </button>
            </td>
        </tr>`;
    });

    tbody.innerHTML = html;
}

// [3] UI 보조 로직
const UIHelper = {
    handleEditClick(id) {
        if (DataService.isUploading) return;
        const item = centerData.find(d => d.id === id);

        if (item.isEditing) {
            // 저장(완료) 시점
            const titleVal = document.getElementById(`input-${id}`).value.trim();
            if (!titleVal) return alert("제목을 입력하세요.");
            if (item.isNew && !DataService.selectedFile) return alert("파일을 선택하세요.");

            // 서버 통신 요청 (adminDataSV.js 호출)
            DataService.executeUpload(id, titleVal, item.isNew);
        } else {
            // 수정 모드 진입 (간섭 차단)
            if (isSelectionMode) toggleSelectionMode();
            this.cancelAllEditing();
            
            item.isEditing = true;
            editingId = id;
            renderAdminData();
        }
    },

    cancelAllEditing() {
        centerData = centerData.filter(i => !i.isNew);
        centerData.forEach(i => i.isEditing = false);
        editingId = null;
        DataService.selectedFile = null;
        renderAdminData();
    },

    triggerFile() {
        document.getElementById('hiddenFileInput').click();
    }
};

// [4] 공통 버튼 제어
function toggleSelectionMode() {
    if (DataService.isUploading) return;
    if (editingId) UIHelper.cancelAllEditing();

    isSelectionMode = !isSelectionMode;
    document.body.classList.toggle('selection-mode', isSelectionMode);
    
    const delBtn = document.getElementById('deleteBtn');
    const toggleBtn = document.getElementById('toggleSelectMode');
    
    if (delBtn) delBtn.style.display = isSelectionMode ? 'inline-block' : 'none';
    if (toggleBtn) toggleBtn.innerText = isSelectionMode ? "취소" : "선택 모드";
    
    renderAdminData();
}

function addNewData() {
    if (DataService.isUploading || editingId) return alert("이미 작업 중입니다.");
    if (isSelectionMode) toggleSelectionMode();

    const newId = Date.now();
    centerData.unshift({ 
        id: newId, title: "", fileName: "", 
        isEditing: true, isNew: true 
    });
    editingId = newId;
    renderAdminData();
}

// 파일 선택 시 처리
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        DataService.selectedFile = file;
        const display = document.getElementById('fileNameDisplay');
        if (display) display.innerText = file.name;
    }
}

// 시작
window.onload = initAdminData;