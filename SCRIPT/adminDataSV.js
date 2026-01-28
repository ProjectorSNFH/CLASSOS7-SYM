const DataService = {
    isUploading: false,
    selectedFile: null,
    SERVER_URL: "https://classos7-dx.vercel.app",

    // [1] 데이터 불러오기 (CORS 이슈 대응을 위해 명시적 호출)
    async fetchData() {
        try {
            const res = await fetch(`${this.SERVER_URL}/api/auth/import?target=datacenter`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            if (!res.ok) throw new Error("서버 응답 오류");
            return await res.json();
        } catch (e) {
            console.error("Fetch fetchData Failed:", e);
            return [];
        }
    },

    // [2] 업로드 로직 (Vercel Blob 사용)
    async executeUpload(id, title, isNew) {
        this.isUploading = true;
        const bar = document.getElementById('progressBar');
        const panel = document.getElementById('uploadStatusPanel');
        if (panel) panel.style.display = 'block';

        try {
            let fileUrl = "";
            let fileName = "";

            // 신규 파일이 있는 경우 Vercel Blob으로 직접 전송 (4.5MB 우회)
            if (isNew && this.selectedFile) {
                this.updateStatus("저장소로 파일 전송 중...", 20);
                
                // Vercel Blob용 헬퍼 API 호출 (가정)
                const blobRes = await fetch(`${this.SERVER_URL}/api/upload/blob?filename=${encodeURIComponent(this.selectedFile.name)}`, {
                    method: 'POST',
                    body: this.selectedFile,
                });
                
                if (!blobRes.ok) throw new Error("Blob Storage Upload Failed");
                const blobData = await blobRes.json();
                fileUrl = blobData.url;
                fileName = this.selectedFile.name;
                this.updateStatus("저장소 전송 완료", 45);
            }

            // 구글 드라이브 동기화 요청 (서버에 URL만 전달)
            this.updateStatus("구글 드라이브 동기화 요청...", 50);
            const res = await fetch(`${this.SERVER_URL}/api/auth/upload`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, title, fileUrl, fileName, isNew })
            });

            if (res.ok) {
                this.startPolling(bar);
            } else {
                throw new Error("서버 동기화 요청 실패");
            }

        } catch (e) {
            alert("에러: " + e.message);
            this.resetUI();
        }
    },

    // [3] 진행 상태 폴링
    startPolling(bar) {
        const timer = setInterval(async () => {
            try {
                const res = await fetch(`${this.SERVER_URL}/api/auth/upload`);
                const status = await res.json();
                
                if (bar) bar.style.width = status.progress + '%';
                this.updateStatus(status.stage || "진행 중...");

                if (status.progress >= 100) {
                    clearInterval(timer);
                    setTimeout(() => location.reload(), 800);
                }
            } catch (e) {
                clearInterval(timer);
            }
        }, 1000);
    },

    updateStatus(msg, prog = null) {
        const txt = document.getElementById('uploadFileName');
        const bar = document.getElementById('progressBar');
        if (txt) txt.innerText = msg;
        if (prog !== null && bar) bar.style.width = prog + '%';
    },

    resetUI() {
        this.isUploading = false;
        const panel = document.getElementById('uploadStatusPanel');
        if (panel) panel.style.display = 'none';
    }
};

// 선택 삭제 함수
async function deleteSelected() {
    const checked = document.querySelectorAll('.row-checkbox:checked');
    if (checked.length === 0) return alert("삭제할 대상을 선택하세요.");
    if (!confirm("정말 삭제하시겠습니까?")) return;

    for (let cb of checked) {
        await fetch(`${DataService.SERVER_URL}/api/auth/upload`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: cb.value })
        });
    }
    location.reload();
}