const DataService = {
    isUploading: false,
    selectedFile: null,
    SERVER_URL: "https://classos7-dx.vercel.app",

    async fetchData() {
        try {
            const res = await fetch(`${this.SERVER_URL}/api/auth/import?target=datacenter`);
            return await res.json();
        } catch (e) { return []; }
    },

    async executeUpload(id, title, isNew) {
        if (this.isUploading) return;
        this.isUploading = true;
        
        document.getElementById('uploadStatusPanel').style.display = 'block';
        const bar = document.getElementById('progressBar');
        const statusText = document.getElementById('uploadFileName');

        try {
            let fileUrl = "";
            let fileName = "";

            if (isNew && this.selectedFile) {
                statusText.innerText = "1단계: 대용량 파일 저장소 업로드 중...";
                const bRes = await fetch(`${this.SERVER_URL}/api/auth/upload?mode=blob&filename=${encodeURIComponent(this.selectedFile.name)}`, {
                    method: 'POST', body: this.selectedFile
                });
                const bData = await bRes.json();
                if (!bRes.ok) throw new Error(bData.error || "저장소 업로드 실패");
                fileUrl = bData.url;
                fileName = this.selectedFile.name;
            }

            statusText.innerText = "2단계: 서버 작업 접수 중...";
            const syncRes = await fetch(`${this.SERVER_URL}/api/auth/upload`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, title, fileUrl, fileName, isNew })
            });

            // 200(성공) 또는 202(접수됨)일 경우 폴링 시작
            if (syncRes.ok || syncRes.status === 202) {
                this.startPolling(bar, statusText);
            } else {
                const errData = await syncRes.json();
                throw new Error(errData.error || "서버 응답 오류");
            }
        } catch (e) {
            alert("오류 발생: " + e.message);
            this.isUploading = false;
        }
    },

    async deleteItems(ids) {
        for (const id of ids) {
            await fetch(`${this.SERVER_URL}/api/auth/upload`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
        }
    },

    startPolling(bar, statusText) {
        const timer = setInterval(async () => {
            try {
                const res = await fetch(`${this.SERVER_URL}/api/auth/upload`);
                const s = await res.json();
                if (bar) bar.style.width = s.progress + '%';
                if (statusText) statusText.innerText = s.stage;
                
                if (s.progress >= 100) {
                    clearInterval(timer);
                    setTimeout(() => location.reload(), 1000);
                } else if (s.stage.includes("에러")) {
                    clearInterval(timer);
                    alert(s.stage);
                    this.isUploading = false;
                }
            } catch (e) { clearInterval(timer); }
        }, 1500);
    }
};