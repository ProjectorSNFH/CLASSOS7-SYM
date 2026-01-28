// @vercel/blob 패키지 필요 없이 브라우저 기본 fetch로 구현 가능
const DataService = {
    isUploading: false,
    selectedFile: null,
    SERVER_URL: "https://classos7-dx.vercel.app",

    async executeUpload(id, title, isNew) {
        this.isUploading = true;
        const bar = document.getElementById('progressBar');
        document.getElementById('uploadStatusPanel').style.display = 'block';

        try {
            let fileUrl = "";
            let fileName = "";

            if (isNew && this.selectedFile) {
                // [Phase 1] Vercel Blob으로 직접 업로드 (4.5MB 제한 우회)
                document.getElementById('uploadFileName').innerText = "Vercel Blob 저장소 전송 중...";
                const response = await fetch(`${this.SERVER_URL}/api/upload/blob?filename=${this.selectedFile.name}`, {
                    method: 'POST',
                    body: this.selectedFile,
                });
                const blobData = await response.json();
                fileUrl = blobData.url; // 저장된 파일 경로
                fileName = this.selectedFile.name;
                bar.style.width = '45%';
            }

            // [Phase 2] 서버에 메타데이터(URL, 제목 등) 전송
            document.getElementById('uploadFileName').innerText = "구글 드라이브 동기화 요청 중...";
            const res = await fetch(`${this.SERVER_URL}/api/auth/upload`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, title, fileUrl, fileName, isNew })
            });

            if (res.ok) {
                this.startPolling(bar);
            } else {
                throw new Error("서버 동기화 실패");
            }

        } catch (e) {
            alert("업로드 에러: " + e.message);
            this.isUploading = false;
        }
    },

    startPolling(bar) {
        const timer = setInterval(async () => {
            const res = await fetch(`${this.SERVER_URL}/api/auth/upload`);
            const s = await res.json();
            bar.style.width = s.progress + '%';
            document.getElementById('uploadFileName').innerText = s.stage;
            if (s.progress >= 100) {
                clearInterval(timer);
                setTimeout(() => location.reload(), 800);
            }
        }, 1000);
    }
};