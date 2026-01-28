const DataService = {
    isUploading: false,
    selectedFile: null,
    SERVER_URL: "https://classos7-dx.vercel.app",

    // [중요] fetchData 함수 정의 (TypeError 방지)
    async fetchData() {
        try {
            const res = await fetch(`${this.SERVER_URL}/api/auth/import?target=datacenter`);
            if (!res.ok) throw new Error("서버 응답 없음");
            return await res.json();
        } catch (e) {
            console.error("fetchData 실패:", e);
            return [];
        }
    },

    // 업로드 통합 실행
    async executeUpload(id, title, isNew) {
        this.isUploading = true;
        const panel = document.getElementById('uploadStatusPanel');
        const bar = document.getElementById('progressBar');
        if (panel) panel.style.display = 'block';

        try {
            let fileUrl = "";
            let fileName = "";

            // 신규 파일이 있는 경우 Blob으로 먼저 업로드
            if (isNew && this.selectedFile) {
                document.getElementById('uploadFileName').innerText = "파일 저장소로 전송 중...";
                const blobRes = await fetch(`${this.SERVER_URL}/api/auth/upload?mode=blob&filename=${encodeURIComponent(this.selectedFile.name)}`, {
                    method: 'POST',
                    body: this.selectedFile
                });
                
                if (!blobRes.ok) throw new Error("Blob 전송 실패 (CORS 또는 토큰 확인 필요)");
                const blobData = await blobRes.json();
                fileUrl = blobData.url;
                fileName = this.selectedFile.name;
            }

            // 구글 드라이브 동기화 요청 (JSON 전송)
            document.getElementById('uploadFileName').innerText = "구글 드라이브 동기화 중...";
            const syncRes = await fetch(`${this.SERVER_URL}/api/auth/upload`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, title, fileUrl, fileName, isNew })
            });

            if (syncRes.ok) {
                this.startPolling(bar);
            } else {
                throw new Error("동기화 요청 실패");
            }
        } catch (e) {
            alert("작업 실패: " + e.message);
            this.isUploading = false;
        }
    },

    startPolling(bar) {
        const timer = setInterval(async () => {
            try {
                const res = await fetch(`${this.SERVER_URL}/api/auth/upload`);
                const status = await res.json();
                if (bar) bar.style.width = status.progress + '%';
                document.getElementById('uploadFileName').innerText = status.stage;

                if (status.progress >= 100) {
                    clearInterval(timer);
                    setTimeout(() => location.reload(), 1000);
                }
            } catch (e) { clearInterval(timer); }
        }, 1000);
    }
};