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
                statusText.innerText = "저장소 업로드 중...";
                const bRes = await fetch(`${this.SERVER_URL}/api/auth/upload?mode=blob&filename=${encodeURIComponent(this.selectedFile.name)}`, {
                    method: 'POST', body: this.selectedFile
                });
                if (!bRes.ok) {
                    const err = await bRes.json();
                    throw new Error(err.error || "Blob Error");
                }
                const bData = await bRes.json();
                fileUrl = bData.url;
                fileName = this.selectedFile.name;
            }

            statusText.innerText = "동기화 요청 중...";
            const syncRes = await fetch(`${this.SERVER_URL}/api/auth/upload`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, title, fileUrl, fileName, isNew })
            });

            if (syncRes.status === 202 || syncRes.ok) {
                this.startPolling(bar, statusText);
            } else {
                throw new Error("서버 접수 실패");
            }
        } catch (e) {
            alert("실패: " + e.message);
            this.isUploading = false;
            document.getElementById('uploadStatusPanel').style.display = 'none';
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