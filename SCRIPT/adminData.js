const DATA_SERVER_URL = "https://classos7-dx.vercel.app";
let centerData = [];
let isSelectionMode = false;
let editingId = null;
let currentFile = null; 
let isUploading = false; 

// [보안] 이탈 방지 로직
window.addEventListener('beforeunload', (e) => {
    if (editingId !== null || isUploading) {
        e.preventDefault();
        e.returnValue = ''; 
    }
});

const init = () => {
    fetchCenterData();
};
window.onload = init;

async function fetchCenterData() {
    try {
        const res = await fetch(`${DATA_SERVER_URL}/api/auth/import?target=datacenter`);
        centerData = await res.json();
        renderAdminData();
    } catch (e) { alert("데이터 로드 실패"); }
}

function renderAdminData() {
    const tbody = document.getElementById('admin-data-body');
    if (!tbody) return;

    tbody.innerHTML = centerData.map(item => `
        <tr data-id="${item.id}">
            <td class="col-select"><input type="checkbox" class="row-checkbox" value="${item.id}"></td>
            <td class="col-title">
                ${item.isEditing 
                    ? `<input type="text" class="edit-input" value="${item.title}" id="input-${item.id}" placeholder="제목 입력">` 
                    : `<span>${item.title}</span>`
                }
            </td>
            <td class="col-file">
                ${item.isEditing && item.isNew && !item.fileName 
                    ? `<button id="fileBtn-${item.id}" class="control-btn" style="padding: 5px 10px; font-size: 0.8rem;" onclick="triggerFileUpload()">📁 파일 선택</button>`
                    : `<span class="${item.isEditing ? 'file-link-active' : 'file-link-static'}" ${item.isEditing ? 'onclick="alertFileNotice()"' : ''}>
                        ${item.fileName || "파일 없음"}
                       </span>`
                }
            </td>
            <td class="col-manage">
                <button class="edit-icon-btn ${item.isEditing ? 'save-icon-btn' : ''}" 
                        onclick="toggleEdit(${item.id})"
                        ${(isSelectionMode || isUploading) && !item.isEditing ? 'disabled style="opacity:0.3"' : ''}>
                    ${item.isEditing ? '✔' : '✎'}
                </button>
            </td>
        </tr>
    `).join('');
}

// 모드 제어: 선택 모드
function toggleSelectionMode() {
    if (isUploading) return;
    if (editingId !== null) cancelEditing();
    
    isSelectionMode = !isSelectionMode;
    document.body.classList.toggle('selection-mode', isSelectionMode);
    document.getElementById('toggleSelectMode').innerText = isSelectionMode ? "선택 모드 취소" : "선택 모드";
    document.getElementById('deleteBtn').style.display = isSelectionMode ? "inline-block" : "none";
    renderAdminData();
}

// 모드 제어: 새로 만들기
function addNewData() {
    if (isUploading || editingId !== null) return;
    if (isSelectionMode) toggleSelectionMode();

    const newId = Date.now();
    centerData.unshift({ id: newId, title: "", fileName: "", isEditing: true, isNew: true });
    editingId = newId;
    renderAdminData();
}

function triggerFileUpload() {
    document.getElementById('hiddenFileInput').click();
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
        alert("파일 크기 제한 초과 (최대 50MB)");
        event.target.value = '';
        return;
    }

    const item = centerData.find(d => d.id === editingId);
    if (item) {
        item.fileName = file.name;
        currentFile = file;
        animateFileFly(event.clientX, event.clientY);
    }
    renderAdminData();
}

// 모드 제어: 수정/저장 (V버튼 클릭 시)
async function toggleEdit(id) {
    const item = centerData.find(d => d.id === id);
    if (item.isEditing) {
        const title = document.getElementById(`input-${id}`).value;
        if (!title.trim()) return alert("제목을 입력하세요.");
        if (item.isNew && !currentFile) return alert("파일을 선택하세요.");

        startUpload(item, title);
    } else {
        if (isUploading) return;
        if (editingId !== null) cancelEditing();
        if (isSelectionMode) toggleSelectionMode();
        item.isEditing = true;
        editingId = id;
        renderAdminData();
    }
}

function startUpload(item, title) {
    isUploading = true;
    const panel = document.getElementById('uploadStatusPanel');
    panel.style.display = 'block';
    document.getElementById('uploadFileName').innerText = item.fileName;
    
    const startTime = Date.now();
    const xhr = new XMLHttpRequest();
    
    xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
            const percent = (e.loaded / e.total) * 100;
            const speed = (e.loaded / ((Date.now() - startTime) / 1000) / 1024).toFixed(0);
            document.getElementById('progressBar').style.width = percent + '%';
            document.getElementById('uploadSize').innerText = `${(e.loaded/1048576).toFixed(1)}MB / ${(e.total/1048576).toFixed(1)}MB`;
            document.getElementById('uploadSpeed').innerText = `${speed} KB/s`;
        }
    };

    xhr.onload = function() {
        const result = JSON.parse(xhr.responseText);
        if (xhr.status === 200 && result.success) {
            alert("업로드 완료!");
            location.reload();
        } else {
            alert("실패: " + result.message);
            resetUpload();
        }
    };

    const formData = new FormData();
    formData.append('file', currentFile);
    formData.append('title', title);
    formData.append('uploader', getCookie('userName') || '관리자');

    xhr.open('POST', `${DATA_SERVER_URL}/api/auth/upload`);
    xhr.setRequestHeader('x-user-role', getCookie('userRole'));
    xhr.send(formData);
}

function cancelEditing() {
    if (isUploading) return;
    centerData = centerData.filter(item => !item.isNew);
    centerData.forEach(item => item.isEditing = false);
    editingId = null;
    currentFile = null;
    renderAdminData();
}

function animateFileFly(x, y) {
    const icon = document.createElement('div');
    icon.className = 'file-fly';
    icon.innerHTML = '📄';
    icon.style.left = x + 'px'; icon.style.top = y + 'px';
    document.body.appendChild(icon);
    setTimeout(() => {
        const target = document.getElementById('uploadStatusPanel').getBoundingClientRect();
        icon.style.left = target.left + 'px'; icon.style.top = target.top + 'px';
        icon.style.opacity = '0';
        setTimeout(() => icon.remove(), 800);
    }, 50);
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}