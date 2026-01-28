const DataService = {
    isUploading: false,
    selectedFile: null,
    SERVER_URL: "https://classos7-dx.vercel.app",

    // [데이터 가져오기] - 이 함수가 없어서 발생한 TypeError 해결
    async fetchData() {
        const res = await fetch(`${this.SERVER_URL}/api/auth/import?target=datacenter`);
        if (!res.ok) throw new Error("서버에서 데이터를 가져올 수 없습니다.");
        return await res.json();
    },

    // [통합 업로드 실행]
    async executeUpload(id, title, isNew) {
        this.isUploading = true;
        const bar = document.getElementById('progressBar');
        document.getElementById('uploadStatusPanel').style.display = 'block';

        try {
            let fileUrl = "";
            let fileName = "";

            if (isNew && this.selectedFile) {
                // 1. Vercel Blob으로 파일 직송 (4.5MB 제한 회피)
                const blobRes = await fetch(`${this.SERVER_URL}/api/auth/upload?mode=blob&filename=${encodeURIComponent(this.selectedFile.name)}`, {
                    method: 'POST',
                    body: this.selectedFile
                });
                const blobData = await blobRes.json();
                fileUrl = blobData.url;
                fileName = this.selectedFile.name;
            }

            // 2. 구글 드라이브 동기화 요청
            await fetch(`${this.SERVER_URL}/api/auth/upload`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, title, fileUrl, fileName, isNew })
            });

            this.startPolling(bar);
        } catch (e) {
            alert("업로드 실패: " + e.message);
            this.isUploading = false;
        }
    },

    startPolling(bar) {
        const timer = setInterval(async () => {
            const res = await fetch(`${this.SERVER_URL}/api/auth/upload`);
            const status = await res.json();
            if (bar) bar.style.width = status.progress + '%';
            document.getElementById('uploadFileName').innerText = status.stage;
            if (status.progress >= 100) {
                clearInterval(timer);
                setTimeout(() => location.reload(), 1000);
            }
        }, 1000);
    }
};