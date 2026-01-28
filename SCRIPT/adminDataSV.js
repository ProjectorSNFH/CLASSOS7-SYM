const DataService = {
    isUploading: false,
    selectedFile: null,
    SERVER_URL: "https://classos7-dx.vercel.app",

    // 데이터 불러오기
    async fetchData() {
        const res = await fetch(`${this.SERVER_URL}/api/auth/import?target=datacenter`);
        if (!res.ok) throw new Error("Load Error");
        return await res.json();
    },

    // 업로드 통합 실행 (Blob -> Google Drive -> DB Update)
    async executeUpload(id, title, isNew) {
        this.isUploading = true;
        const panel = document.getElementById('uploadStatusPanel');
        const bar = document.getElementById('progressBar');
        if (panel) panel.style.display = 'block';

        try {
            let fileUrl = "";
            let fileName = "";

            // 1단계: Vercel Blob 직송 (용량 제한 회피)
            if (isNew && this.selectedFile) {
                this.updateUI("저장소 업로드 중...", 30);
                const blobRes = await fetch(`${this.SERVER_URL}/api/auth/upload?mode=blob&filename=${encodeURIComponent(this.selectedFile.name)}`, {
                    method: 'POST',
                    body: this.selectedFile
                });
                const blobData = await blobRes.json();
                fileUrl = blobData.url;
                fileName = this.selectedFile.name;
            }

            // 2단계: 구글 전송 및 DB 기록 요청
            this.updateUI("데이터베이스 기록 중...", 60);
            const syncRes = await fetch(`${this.SERVER_URL}/api/auth/upload`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, title, fileUrl, fileName, isNew })
            });

            if (syncRes.ok) {
                this.startPolling(bar);
            } else {
                throw new Error("동기화 실패");
            }
        } catch (e) {
            alert("실패: " + e.message);
            this.isUploading = false;
        }
    },

    // 삭제 실행
    async deleteItems(ids) {
        for (const id of ids) {
            await fetch(`${this.SERVER_URL}/api/auth/upload`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
        }
    },

    updateUI(msg, prog) {
        document.getElementById('uploadFileName').innerText = msg;
        if (prog) document.getElementById('progressBar').style.width = prog + '%';
    },

    startPolling(bar) {
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