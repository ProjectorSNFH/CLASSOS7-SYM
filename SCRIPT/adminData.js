const DATA_SERVER_URL = "https://classos7-dx.vercel.app";
let centerData = [];
let isSelectionMode = false;
let editingId = null;
let isUploading = false;
let currentFile = null;

// [보안] 페이지 이탈 방지
window.onbeforeunload = (e) => {
    if (editingId || isUploading) return "작성 중인 내용이 사라집니다.";
};

// [초기화] 데이터 로드
async function fetchCenterData() {
    try {
        const res = await fetch(`${DATA_SERVER_URL}/api/auth/import?target=datacenter`);
        const data = await res.json();
        centerData = data.map(item => ({ ...item, isEditing: false, isNew: false }));
        renderAdminData();
    } catch (e) { console.error("데이터 로드 실패"); }
}

function renderAdminData() {
    const tbody = document.getElementById('admin-data-body');
    if (!tbody) return;
    
    tbody.innerHTML = centerData.map(item => `
        <tr data-id="${item.id}">
            <td class="col-select"><input type="checkbox" class="row-checkbox" value="${item.id}"></td>
            <td class="col-title">
                ${item.isEditing ? `<input type="text" class="edit-input" id="input-${item.id}" value="${item.title}" placeholder="제목 입력">` : `<span>${item.title}</span>`}
            </td>
            <td class="col-file">
                ${item.isEditing && item.isNew && !item.fileName 
                    ? `<button class="control-btn" style="padding:5px" onclick="triggerFileUpload()">📁 파일 선택</button>` 
                    : `<span>${item.fileName || '파일 없음'}</span>`}
            </td>
            <td class="col-manage">
                <button class="edit-icon-btn ${item.isEditing ? 'save-icon-btn' : ''}" onclick="toggleEdit(${item.id})">
                    ${item.isEditing ? '✔' : '✎'}
                </button>
            </td>
        </tr>
    `).join('');
}

// [모드 제어] 
function toggleSelectionMode() {
    if (isUploading) return;
    if (editingId) cancelEditing(); // 수정 중이면 취소
    isSelectionMode = !isSelectionMode;
    document.body.classList.toggle('selection-mode', isSelectionMode);
    document.getElementById('deleteBtn').style.display = isSelectionMode ? 'inline-block' : 'none';
    document.getElementById('toggleSelectMode').innerText = isSelectionMode ? "선택 모드 취소" : "선택 모드";
    renderAdminData();
}

function addNewData() {
    if (isUploading || editingId) return alert("이미 작업 중인 항목이 있습니다.");
    if (isSelectionMode) toggleSelectionMode(); 
    
    const newId = Date.now();
    centerData.unshift({ id: newId, title: "", fileName: "", isEditing: true, isNew: true });
    editingId = newId;
    renderAdminData();
}

function cancelEditing() {
    centerData = centerData.filter(i => !i.isNew);
    centerData.forEach(i => i.isEditing = false);
    editingId = null;
    currentFile = null;
    renderAdminData();
}

// [핵심] 가중치 기반 업로드 엔진
async function startUploadProcess(title) {
    isUploading = true;
    const panel = document.getElementById('uploadStatusPanel');
    const bar = document.getElementById('progressBar');
    panel.style.display = 'block';
    document.getElementById('uploadFileName').innerText = currentFile.name;

    const xhr = new XMLHttpRequest();
    const startTime = Date.now();

    xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
            // 가중치 1단계: Vercel 업로드 (0~45%)
            const vercelProgress = (e.loaded / e.total) * 45;
            bar.style.width = vercelProgress + '%';
            
            const speed = (e.loaded / ((Date.now() - startTime) / 1000) / 1024).toFixed(1);
            document.getElementById('uploadSpeed').innerText = `${speed} KB/s`;
            document.getElementById('uploadSize').innerText = `${(e.loaded/1048576).toFixed(1)} / ${(e.total/1048576).toFixed(1)} MB`;
        }
    };

    xhr.onload = async () => {
        if (xhr.status === 200) {
            // 가중치 2단계: 파일 수정 및 정보 결합 (45~50%)
            bar.style.width = '50%';
            
            // 가중치 3단계: 구글 드라이브 전송 완료 (100%)
            // 서버에서 응답이 왔다는 건 구글 업로드까지 끝났다는 의미
            bar.style.width = '100%';
            setTimeout(() => {
                alert("업로드 및 구글 드라이브 저장 완료!");
                location.reload();
            }, 500);
        } else {
            alert("전송 실패");
            isUploading = false;
            panel.style.display = 'none';
        }
    };

    const formData = new FormData();
    formData.append('file', currentFile);
    formData.append('title', title);
    formData.append('uploader', '관리자');

    xhr.open('POST', `${DATA_SERVER_URL}/api/auth/upload`);
    xhr.setRequestHeader('x-user-role', 'A'); // 관리자 권한 헤더
    xhr.send(formData);
}

function toggleEdit(id) {
    const item = centerData.find(d => d.id === id);
    if (item.isEditing) {
        const titleInput = document.getElementById(`input-${id}`);
        if (!titleInput.value.trim()) return alert("제목을 입력하세요.");
        if (item.isNew && !currentFile) return alert("파일을 선택하세요.");
        
        startUploadProcess(titleInput.value);
    } else {
        if (isUploading) return;
        if (isSelectionMode) toggleSelectionMode();
        if (editingId) cancelEditing();
        
        item.isEditing = true;
        editingId = id;
        renderAdminData();
    }
}

// [삭제 로직]
async function deleteSelected() {
    const checked = document.querySelectorAll('.row-checkbox:checked');
    if (checked.length === 0) return alert("삭제할 항목을 선택하세요.");
    if (!confirm("정말 삭제하시겠습니까? 구글 드라이브 파일은 유지됩니다.")) return;

    const ids = Array.from(checked).map(cb => parseInt(cb.value));
    centerData = centerData.filter(item => !ids.includes(item.id));
    
    // write.js를 호출하여 datacenter 리스트 동기화
    const res = await fetch(`${DATA_SERVER_URL}/api/auth/write`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'A' },
        body: JSON.stringify({ target: 'datacenter', data: { dataList: centerData } })
    });

    if(res.ok) {
        alert("삭제 완료");
        fetchCenterData();
    }
}

// 파일 선택 처리
function triggerFileUpload() { document.getElementById('hiddenFileInput').click(); }
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) return alert("50MB 제한!");
    
    currentFile = file;
    centerData.find(d => d.id === editingId).fileName = file.name;
    renderAdminData();
}

window.onload = fetchCenterData;