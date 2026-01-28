// adminDataSV.js
const DataService = {
    isUploading: false,
    selectedFile: null,
    SERVER_URL: "https://classos7-dx.vercel.app",

    // 데이터 가져오기
    async fetchData() {
        const res = await fetch(`${this.SERVER_URL}/api/auth/import?target=datacenter`);
        return await res.json();
    },

    // 업로드 프로세스 (45% -> 5% -> 50%)
    async executeUpload(id, title, isNew) {
        this.isUploading = true;
        const bar = document.getElementById('progressBar');
        const panel = document.getElementById('uploadStatusPanel');
        if (panel) panel.style.display = 'block';

        const fd = new FormData();
        if (isNew && this.selectedFile) fd.append('file', this.selectedFile);
        fd.append('title', title);
        fd.append('id', id);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${this.SERVER_URL}/api/auth/upload`);

        // Phase 1: Vercel 전송 (0% ~ 45%)
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable && bar) {
                const p = (e.loaded / e.total) * 45;
                bar.style.width = p + '%';
                this.updateUIInfo("서버로 파일 전송 중...", e.loaded, e.total);
            }
        };

        xhr.onload = () => {
            if (xhr.status === 200) {
                // Phase 2: 정보 수정 완료 (50%)
                if (bar) bar.style.width = '50%';
                this.updateUIInfo("구글 드라이브 동기화 중...");
                // Phase 3: 구글 드라이브 전송 감시 (50% ~ 100%)
                this.startPolling(bar);
            } else {
                alert("전송 중 오류가 발생했습니다.");
                this.reset();
            }
        };
        xhr.send(fd);
    },

    startPolling(bar) {
        const timer = setInterval(async () => {
            try {
                const res = await fetch(`${this.SERVER_URL}/api/auth/upload`);
                const status = await res.json();
                if (bar) bar.style.width = status.progress + '%';
                this.updateUIInfo(status.stage || "진행 중...");

                if (status.progress >= 100) {
                    clearInterval(timer);
                    setTimeout(() => location.reload(), 500);
                }
            } catch (e) {
                clearInterval(timer);
            }
        }, 1000);
    },

    async deleteItems(ids) {
        if (!confirm("구글 드라이브 파일도 함께 삭제됩니다. 계속하시겠습니까?")) return;
        for (const id of ids) {
            await fetch(`${this.SERVER_URL}/api/auth/upload`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
        }
        location.reload();
    },

    updateUIInfo(stage, loaded = 0, total = 0) {
        const nameText = document.getElementById('uploadFileName');
        const sizeText = document.getElementById('uploadSize');
        if (nameText) nameText.innerText = stage;
        if (sizeText && total > 0) {
            sizeText.innerText = `${(loaded/1048576).toFixed(1)}MB / ${(total/1048576).toFixed(1)}MB`;
        }
    },

    reset() {
        this.isUploading = false;
        const panel = document.getElementById('uploadStatusPanel');
        if (panel) panel.style.display = 'none';
    }
};