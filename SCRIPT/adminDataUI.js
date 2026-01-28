const DataService = {
    isUploading: false,
    selectedFile: null,
    SERVER_URL: "https://classos7-dx.vercel.app",

    async fetchData() {
        const res = await fetch(`${this.SERVER_URL}/api/auth/import?target=datacenter`);
        return await res.json();
    },

    async executeUpload(id, title, isNew) {
        if (this.isUploading) return;
        this.isUploading = true;

        const panel = document.getElementById('uploadStatusPanel');
        const bar = document.getElementById('progressBar');
        if (panel) panel.style.display = 'block';

        const fd = new FormData();
        fd.append('id', id);
        fd.append('title', title);
        if (isNew && this.selectedFile) {
            fd.append('file', this.selectedFile);
        }

        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${this.SERVER_URL}/api/auth/upload`);
        
        // 브라우저 -> Vercel 구간 게이지 (0~45%)
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable && bar) {
                const p = (e.loaded / e.total) * 45;
                bar.style.width = p + '%';
                document.getElementById('uploadFileName').innerText = "Vercel로 전송 중...";
            }
        };

        xhr.onload = () => {
            if (xhr.status === 200) {
                // 서버 내부 작업 감시 시작
                this.startPolling(bar);
            } else {
                alert("서버 전송 실패 (상태 코드: " + xhr.status + ")");
                this.resetUI();
            }
        };

        xhr.onerror = () => {
            alert("네트워크 연결 오류 또는 CORS 차단");
            this.resetUI();
        };

        xhr.send(fd);
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
                    setTimeout(() => location.reload(), 800);
                }
            } catch (e) {
                console.error("Polling Error");
            }
        }, 1000);
    },

    resetUI() {
        this.isUploading = false;
        const panel = document.getElementById('uploadStatusPanel');
        if (panel) panel.style.display = 'none';
    }
};