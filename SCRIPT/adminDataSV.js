const DataService = {
    isUploading: false,
    selectedFile: null,
    SERVER_URL: "https://classos7-dx.vercel.app",

    async executeUpload(id, title, isNew) {
        this.isUploading = true;
        const panel = document.getElementById('uploadStatusPanel');
        if (panel) panel.style.display = 'block';

        try {
            let fileUrl = "";
            let fileName = "";

            if (isNew && this.selectedFile) {
                document.getElementById('uploadFileName').innerText = "파일 저장소 전송 중...";
                
                // [수정] 경로를 /api/auth/upload로 통일하고 mode=blob 추가
                const blobRes = await fetch(`${this.SERVER_URL}/api/auth/upload?mode=blob&filename=${encodeURIComponent(this.selectedFile.name)}`, {
                    method: 'POST',
                    body: this.selectedFile // 파일을 바이너리로 직접 전송
                });
                
                if (!blobRes.ok) throw new Error("저장소 전송 실패 (CORS 또는 토큰 확인)");
                const blobData = await blobRes.json();
                fileUrl = blobData.url;
                fileName = this.selectedFile.name;
            }

            // 구글 드라이브 동기화 요청
            document.getElementById('uploadFileName').innerText = "구글 드라이브 동기화 중...";
            await fetch(`${this.SERVER_URL}/api/auth/upload`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, title, fileUrl, fileName, isNew })
            });

            this.startPolling();
        } catch (e) {
            alert("업로드 실패: " + e.message);
            this.isUploading = false;
        }
    },

    startPolling() {
        const bar = document.getElementById('progressBar');
        const timer = setInterval(async () => {
            const res = await fetch(`${this.SERVER_URL}/api/auth/upload`);
            const s = await res.json();
            if (bar) bar.style.width = s.progress + '%';
            document.getElementById('uploadFileName').innerText = s.stage;
            if (s.progress >= 100) {
                clearInterval(timer);
                setTimeout(() => location.reload(), 1000);
            }
        }, 1000);
    }
};