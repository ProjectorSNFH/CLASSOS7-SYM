/* adminDataSV.js */
const DataService = {
    isUploading: false,
    selectedFile: null,
    DATA_SERVER: "https://classos7-dx.vercel.app",

    // [1] 데이터 불러오기 (import.js 연동)
    async fetchData() {
        const res = await fetch(`${this.DATA_SERVER}/api/auth/import?target=datacenter`);
        return await res.json();
    },

    // [2] 업로드 및 전송 시스템 (가중치 게이지)
    async upload(id, title, isNew) {
        this.isUploading = true;
        this.showPanel(true);
        const bar = document.getElementById('progressBar');

        const formData = new FormData();
        formData.append('file', this.selectedFile);
        formData.append('title', title);
        formData.append('isNew', isNew);

        // 1. Vercel로 업로드 요청 (XHR 활용 0~45%)
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${this.DATA_SERVER}/api/auth/upload`);
        
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
                const vercelProgress = (e.loaded / e.total) * 45;
                bar.style.width = vercelProgress + '%';
                this.updateDetail("Vercel 업로드 중...", e.loaded, e.total);
            }
        };

        xhr.onload = async () => {
            if (xhr.status === 200) {
                // 2. 파일 수정 및 구글 전송 단계 시작 (45~100%)
                this.startPolling(bar);
            } else {
                alert("업로드 실패");
                this.resetState();
            }
        };
        xhr.send(formData);
    },

    // [3] 서버 상태 폴링 (파일 수정 5% + 구글 전송 50%)
    startPolling(bar) {
        const interval = setInterval(async () => {
            const res = await fetch(`${this.DATA_SERVER}/api/auth/upload`); // GET 요청
            const status = await res.json();
            
            bar.style.width = status.progress + '%';
            this.updateDetail(status.stage);

            if (status.progress >= 100) {
                clearInterval(interval);
                setTimeout(() => { alert("저장 완료!"); location.reload(); }, 500);
            }
        }, 800);
    },

    // [4] 삭제 요청 시스템
    async deleteItems(ids) {
        if (!confirm("구글 드라이브 파일도 함께 삭제됩니다. 계속하시겠습니까?")) return;
        
        for (let id of ids) {
            await fetch(`${this.DATA_SERVER}/api/auth/upload`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id })
            });
        }
        location.reload();
    },

    // 유틸리티
    showPanel(show) { document.getElementById('uploadStatusPanel').style.display = show ? 'block' : 'none'; },
    updateDetail(stage, loaded = 0, total = 0) {
        document.getElementById('uploadFileName').innerText = stage;
        if (total > 0) {
            document.getElementById('uploadSize').innerText = `${(loaded/1048576).toFixed(1)} / ${(total/1048576).toFixed(1)} MB`;
        }
    },
    resetState() { this.isUploading = false; this.showPanel(false); }
};

// UI에서 호출하는 삭제 함수
function deleteSelected() {
    const checked = document.querySelectorAll('.row-checkbox:checked');
    if (checked.length === 0) return alert("삭제할 대상을 선택하세요.");
    const ids = Array.from(checked).map(cb => parseInt(cb.value));
    DataService.deleteItems(ids);
}