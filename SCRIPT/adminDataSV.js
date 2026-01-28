const DataService = {
    isUploading: false,
    selectedFile: null,
    SERVER_URL: "https://classos7-dx.vercel.app",

    // 데이터 로드
    async fetchData() {
        const res = await fetch(`${this.SERVER_URL}/api/auth/import?target=datacenter`);
        if (!res.ok) throw new Error("Load Fail");
        return await res.json();
    },

    // 업로드 (Blob + JSON 통합)
    async executeUpload(id, title, isNew) {
        this.isUploading = true;
        const bar = document.getElementById('progressBar');
        const panel = document.getElementById('uploadStatusPanel');
        if (panel) panel.style.display = 'block';

        try {
            let fileUrl = "";
            let fileName = "";

            if (isNew && this.selectedFile) {
                // 1단계: Blob 직송 (CORS OK)
                const blobRes = await fetch(`${this.SERVER_URL}/api/auth/upload?mode=blob&filename=${encodeURIComponent(this.selectedFile.name)}`, {
                    method: 'POST',
                    body: this.selectedFile
                });
                const blobData = await blobRes.json();
                fileUrl = blobData.url;
                fileName = this.selectedFile.name;
            }

            // 2단계: 구글 동기화
            await fetch(`${this.SERVER_URL}/api/auth/upload`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, title, fileUrl, fileName, isNew })
            });

            this.startPolling(bar);
        } catch (e) {
            alert("오류: " + e.message);
            this.isUploading = false;
        }
    },

    // 삭제 기능
    async deleteItems(ids) {
        for (const id of ids) {
            await fetch(`${this.SERVER_URL}/api/auth/upload`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
        }
    },

    startPolling(bar) {
        const timer = setInterval(async () => {
            const res = await fetch(`${this.SERVER_URL}/api/auth/upload`);
            const s = await res.json();
            if (bar) bar.style.width = s.progress + '%';
            document.getElementById('uploadFileName').innerText = s.stage;
            if (s.progress >= 100) {
                clearInterval(timer);
                setTimeout(() => location.reload(), 800);
            }
        }, 1000);
    }
};