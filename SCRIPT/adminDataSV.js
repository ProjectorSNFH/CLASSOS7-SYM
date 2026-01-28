const DataService = {
    isUploading: false,
    selectedFile: null,
    SERVER_URL: "https://classos7-dx.vercel.app",

    async fetchData() {
        try {
            const res = await fetch(`${this.SERVER_URL}/api/auth/import?target=datacenter`);
            if (!res.ok) return [];
            return await res.json();
        } catch (e) { return []; }
    },

    async executeUpload(id, title, isNew) {
        if (this.isUploading) return;
        this.isUploading = true;
        
        const panel = document.getElementById('uploadStatusPanel');
        if (panel) panel.style.display = 'block';

        try {
            let fileUrl = "";
            let fileName = "";

            if (isNew && this.selectedFile) {
                this.updateUI("파일 저장소 업로드 중...", 20);
                const bRes = await fetch(`${this.SERVER_URL}/api/auth/upload?mode=blob&filename=${encodeURIComponent(this.selectedFile.name)}`, {
                    method: 'POST',
                    body: this.selectedFile
                });
                
                if (!bRes.ok) throw new Error("토큰 또는 서버 설정 확인 필요");
                const bData = await bRes.json();
                fileUrl = bData.url;
                fileName = this.selectedFile.name;
            }

            this.updateUI("동기화 및 DB 기록 중...", 60);
            const syncRes = await fetch(`${this.SERVER_URL}/api/auth/upload`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, title, fileUrl, fileName, isNew })
            });

            if (syncRes.ok) {
                this.startPolling();
            } else {
                throw new Error("최종 동기화 실패");
            }
        } catch (e) {
            alert("업로드 실패: " + e.message);
            this.isUploading = false;
        }
    },

    async deleteItems(ids) {
        try {
            for (const id of ids) {
                await fetch(`${this.SERVER_URL}/api/auth/upload`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id })
                });
            }
        } catch (e) { console.error("삭제 실패", e); }
    },

    updateUI(msg, prog) {
        const txt = document.getElementById('uploadFileName');
        const bar = document.getElementById('progressBar');
        if (txt) txt.innerText = msg;
        if (bar && prog) bar.style.width = prog + '%';
    },

    startPolling() {
        const timer = setInterval(async () => {
            try {
                const res = await fetch(`${this.SERVER_URL}/api/auth/upload`);
                if (!res.ok) return;
                const s = await res.json();
                this.updateUI(s.stage, s.progress);
                if (s.progress >= 100) {
                    clearInterval(timer);
                    setTimeout(() => location.reload(), 1000);
                }
            } catch (e) { clearInterval(timer); }
        }, 1500);
    }
};