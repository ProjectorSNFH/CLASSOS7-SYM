/* SCRIPT/adminData.js */
const DATA_SERVER_URL = "https://classos7-dx.vercel.app";
let centerData = [];
let editingId = null;
let isSelectionMode = false;
let isUploading = false;
let currentFile = null;

// [1] 초기 로드 (기존 import.js 활용)
async function fetchCenterData() {
    const res = await fetch(`${DATA_SERVER_URL}/api/auth/import?target=datacenter`);
    centerData = await res.json();
    renderAdminData();
}

// [2] 업로드 프로세스 시작
async function startUploadProcess(title) {
    isUploading = true;
    document.getElementById('uploadStatusPanel').style.display = 'block';
    
    const formData = new FormData();
    formData.append('file', currentFile);
    formData.append('title', title);
    formData.append('uploader', '관리자');

    // 실제 업로드 요청
    fetch(`${DATA_SERVER_URL}/api/auth/upload`, {
        method: 'POST',
        headers: { 'x-user-role': 'A' },
        body: formData
    });

    // 상태 확인 폴링 (서버의 progress 값을 가져와 게이지 업데이트)
    const statusInterval = setInterval(async () => {
        const res = await fetch(`${DATA_SERVER_URL}/api/auth/upload`);
        const status = await res.json();
        
        const bar = document.getElementById('progressBar');
        bar.style.width = status.progress + '%';
        document.getElementById('uploadFileName').innerText = `[${status.stage}] ${currentFile.name}`;

        if (status.progress === 100) {
            clearInterval(statusInterval);
            alert("전체 프로세스 완료!");
            location.reload();
        }
    }, 800);
}

// [3] 수정/저장 모드 제어 (상호 차단 완벽 적용)
function toggleEdit(id) {
    if (isUploading) return;
    const item = centerData.find(d => d.id === id);

    if (item.isEditing) {
        const titleVal = document.getElementById(`input-${id}`).value;
        if (item.isNew && !currentFile) return alert("파일이 없습니다.");
        startUploadProcess(titleVal);
    } else {
        // 모든 모드 초기화 후 수정 모드 진입
        if (isSelectionMode) toggleSelectionMode();
        cancelEditing();
        
        item.isEditing = true;
        editingId = id;
        renderAdminData();
    }
}

// [4] 삭제 로직 (구글 드라이브 연동)
async function deleteSelected() {
    const checked = document.querySelectorAll('.row-checkbox:checked');
    if (checked.length === 0) return alert("항목을 선택하세요.");
    
    if (!confirm("구글 드라이브의 실제 파일도 삭제됩니다. 진행하시겠습니까?")) return;

    for (let cb of checked) {
        const id = parseInt(cb.value);
        const item = centerData.find(d => d.id === id);
        
        // 구글 드라이브 삭제 요청 (upload.js의 DELETE 메소드 호출)
        await fetch(`${DATA_SERVER_URL}/api/auth/upload`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileId: item.fileId }) // DB에 저장된 google fileId
        });
    }
    
    // 리스트 업데이트를 위해 write.js 호출 (생략 가능하나 동기화 위해 필요)
    alert("삭제 완료");
    location.reload();
}

function toggleSelectionMode() {
    if (isUploading) return;
    if (editingId) cancelEditing();
    isSelectionMode = !isSelectionMode;
    document.body.classList.toggle('selection-mode', isSelectionMode);
    document.getElementById('deleteBtn').style.display = isSelectionMode ? 'inline-block' : 'none';
    renderAdminData();
}

function addNewData() {
    if (isUploading || editingId) return;
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
}

function triggerFileUpload() { document.getElementById('hiddenFileInput').click(); }
function handleFileSelect(e) {
    currentFile = e.target.files[0];
    centerData.find(d => d.id === editingId).fileName = currentFile.name;
    renderAdminData();
}

window.onload = fetchCenterData;