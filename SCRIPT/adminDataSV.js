const DataService = {
    isUploading: false,
    selectedFile: null,
    SERVER: "https://classos7-dx.vercel.app",

    async fetchData() {
        const r = await fetch(`${this.SERVER}/api/auth/import?target=datacenter`);
        return await r.json();
    },

    async executeUpload(id, title, isNew) {
        this.isUploading = true;
        const panel = document.getElementById('uploadStatusPanel');
        const bar = document.getElementById('progressBar');
        if (panel) panel.style.display = 'block';

        const fd = new FormData();
        if (isNew) fd.append('file', this.selectedFile);
        fd.append('title', title);
        fd.append('id', id);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${this.SERVER}/api/auth/upload`);

        // [Phase 1] Vercel 업로드 (0% ~ 45%)
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
                const p = (e.loaded / e.total) * 45;
                if (bar) bar.style.width = p + '%';
                this.updateText("Vercel로 파일 전송 중...");
            }
        };

        xhr.onload = () => {
            if (xhr.status === 200) {
                // [Phase 2] 파일 수정 및 정보 처리 (응답 시점 50%로 점프)
                if (bar) bar.style.width = '50%';
                this.updateText("데이터 정보 수정 중...");
                
                // [Phase 3] 구글 드라이브 전송 확인 (50% ~ 100% 폴링)
                this.pollStatus(bar);
            } else {
                alert("업로드 실패");
                this.reset();
            }
        };
        xhr.send(fd);
    },

    pollStatus(bar) {
        const timer = setInterval(async () => {
            try {
                const r = await fetch(`${this.SERVER}/api/auth/upload`);
                const s = await r.json();
                
                // 서버에서 주는 progress는 50~100 사이여야 함
                if (bar) bar.style.width = s.progress + '%';
                this.updateText(s.stage || "구글 드라이브 업로드 중...");

                if (s.progress >= 100) {
                    clearInterval(timer);
                    setTimeout(() => { location.reload(); }, 500);
                }
            } catch (e) {
                clearInterval(timer);
            }
        }, 1000);
    },

    async deleteItems() {
        const checked = document.querySelectorAll('.row-checkbox:checked');
        if (checked.length === 0) return;
        if (!confirm("구글 드라이브 파일까지 삭제됩니다. 계속하시겠습니까?")) return;

        for (let cb of checked) {
            await fetch(`${this.SERVER}/api/auth/upload`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: cb.value })
            });
        }
        location.reload();
    },

    updateText(msg) {
        const t = document.getElementById('uploadFileName');
        if (t) t.innerText = msg;
    },

    reset() {
        this.isUploading = false;
        const p = document.getElementById('uploadStatusPanel');
        if (p) p.style.display = 'none';
    }
};

// 전역 삭제 버튼 연결용
function deleteSelected() { DataService.deleteItems(); }