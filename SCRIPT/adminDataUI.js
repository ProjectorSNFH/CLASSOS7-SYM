/**
 * adminDataUI.js
 * 기능: UI 렌더링, 모드 제어(수정/추가/선택), 중복 작업 차단
 */

// [1] 전역 UI 상태 관리
let centerData = [];
let isSelectionMode = false;
let editingId = null;

// [2] 페이지 초기화
async function initAdminData() {
    // DataService는 adminDataSV.js에 정의되어 있어야 함
    centerData = await DataService.fetchData(); 
    renderAdminData();
}

// [3] 테이블 렌더링 (핵심 함수)
function renderAdminData() {
    const tbody = document.getElementById('admin-data-body');
    if (!tbody) return;

    tbody.innerHTML = centerData.map(item => `
        <tr data-id="${item.id}" class="${item.isEditing ? 'editing-row' : ''}">
            <td class="col-select">
                <input type="checkbox" class="row-checkbox" value="${item.id}" data-fileid="${item.fileId}">
            </td>
            <td class="col-title">
                ${item.isEditing 
                    ? `<input type="text" class="edit-input" id="input-${item.id}" value="${item.title}" placeholder="제목을 입력하세요">` 
                    : `<span>${item.title}</span>`}
            </td>
            <td class="col-file">
                ${item.isEditing && item.isNew 
                    ? `<div class="file-upload-zone">
                         <button class="control-btn" onclick="UIHelper.triggerFile()">📁 파일 선택</button>
                         <span id="fileNameDisplay">${DataService.selectedFile ? DataService.selectedFile.name : '선택된 파일 없음'}</span>
                       </div>`
                    : `<span>${item.fileName || '파일 없음'}</span>`}
            </td>
            <td class="col-manage">
                <button class="edit-icon-btn ${item.isEditing ? 'save-icon-btn' : ''}" 
                        onclick="UIHelper.handleEditClick(${item.id})"
                        ${(isSelectionMode || DataService.isUploading) && !item.isEditing ? 'disabled' : ''}>
                    ${item.isEditing ? '✔' : '✎'}
                </button>
            </td>
        </tr>
    `).join('');
}

// [4] UI 보조 로직 (UIHelper)
const UIHelper = {
    // 수정/완료 버튼 클릭 핸들러
    handleEditClick(id) {
        if (DataService.isUploading) return; 
        const item = centerData.find(d => d.id === id);

        if (item.isEditing) {
            // 완료(저장) 모드
            const titleInput = document.getElementById(`input-${id}`);
            const titleValue = titleInput.value.trim();

            if (!titleValue) return alert("제목을 입력해주세요.");
            if (item.isNew && !DataService.selectedFile) return alert("업로드할 파일을 선택해주세요.");

            // 서버 전송 요청 (SV 시스템 호출)
            DataService.executeUpload(id, titleValue, item.isNew);
        } else {
            // 수정 모드 진입
            if (isSelectionMode) toggleSelectionMode(); // 선택 모드 해제
            this.cancelAllEditing(); // 다른 수정 중인 항목 초기화
            
            item.isEditing = true;
            editingId = id;
            renderAdminData();
        }
    },

    // 모든 수정 상태 초기화
    cancelAllEditing() {
        centerData = centerData.filter(item => !item.isNew); // 저장 안 된 새 항목 삭제
        centerData.forEach(item => item.isEditing = false);
        editingId = null;
        DataService.selectedFile = null;
        renderAdminData();
    },

    // 파일 선택창 열기
    triggerFile() {
        const fileInput = document.getElementById('hiddenFileInput');
        if (fileInput) fileInput.click();
    }
};

// [5] 상단 컨트롤 버튼 함수들
function toggleSelectionMode() {
    if (DataService.isUploading) return;
    if (editingId) UIHelper.cancelAllEditing();
    
    isSelectionMode = !isSelectionMode;
    document.body.classList.toggle('selection-mode', isSelectionMode);
    
    // 버튼 UI 업데이트
    document.getElementById('deleteBtn').style.display = isSelectionMode ? 'inline-block' : 'none';
    document.getElementById('toggleSelectMode').innerText = isSelectionMode ? "선택 모드 취소" : "선택 모드";
    
    renderAdminData();
}

function addNewData() {
    if (DataService.isUploading || editingId) return alert("이미 수정 또는 업로드 중인 항목이 있습니다.");
    if (isSelectionMode) toggleSelectionMode();

    const newId = Date.now();
    centerData.unshift({ 
        id: newId, 
        title: "", 
        fileName: "", 
        isEditing: true, 
        isNew: true,
        fileId: null 
    });
    editingId = newId;
    renderAdminData();
}

// [6] 파일 선택 이벤트 핸들러 (Input 태그 연결용)
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        if (file.size > 50 * 1024 * 1024) {
            alert("파일 크기는 50MB를 초과할 수 없습니다.");
            event.target.value = "";
            return;
        }
        DataService.selectedFile = file;
        
        // UI에 파일명 즉시 반영
        const display = document.getElementById('fileNameDisplay');
        if (display) display.innerText = file.name;
    }
}

// [7] 이탈 방지 경고
window.addEventListener('beforeunload', (e) => {
    if (editingId || DataService.isUploading) {
        e.preventDefault();
        e.returnValue = '';
    }
});

// 시작
window.onload = initAdminData;