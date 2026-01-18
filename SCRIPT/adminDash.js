const DATA_SERVER_URL = "https://classos7-dx.vercel.app";

document.addEventListener('DOMContentLoaded', () => {
    // 1. 권한 체크
    const role = getCookie('userRole');
    if (role !== 'A' && role !== 'T') {
        alert("접근 권한이 없습니다.");
        window.location.href = "../dashboard.html";
        return;
    }

    // 권한 확인 완료 시 화면 표시
    document.getElementById('admin-main').style.display = 'block';

    // 2. 초기화 (드롭박스 채우기)
    initSelectBoxes();

    // 3. 로딩 타임아웃 설정 (1분)
    const loadTimeout = setTimeout(() => {
        const overlay = document.getElementById('loading-overlay');
        if (overlay && overlay.style.display !== 'none') {
            document.getElementById('loading-text').innerText = "LOADING FAILED: SERVER TIMEOUT";
            overlay.classList.add('loading-failed');
            setTimeout(() => {
                overlay.style.opacity = '0';
                setTimeout(() => overlay.style.display = 'none', 500);
            }, 3000);
        }
    }, 60000);

    // 4. 기존 서버 데이터 로드
    fetchCurrentAdminData(loadTimeout);
});

function initSelectBoxes() {
    const selects = ['sweep1', 'sweep2', 'mop1', 'mop2'];
    selects.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        for (let i = 1; i <= 30; i++) {
            const num = i < 10 ? `0${i}` : `${i}`;
            const option = document.createElement('option');
            option.value = num;
            option.textContent = `${num}번`;
            el.appendChild(option);
        }
    });
}

/**
 * 서버 데이터 로드 (GET) - 엔드포인트: /api/auth/import?target=dashboard
 */
async function fetchCurrentAdminData(loadTimeout) {
    const overlay = document.getElementById('loading-overlay');
    try {
        const response = await fetch(`${DATA_SERVER_URL}/api/auth/import?target=dashboard`);
        if (!response.ok) throw new Error('서버 데이터를 가져오는 데 실패했습니다.');
        
        const data = await response.json();
        clearTimeout(loadTimeout);

        // 지각생 입력창 세팅
        if (document.getElementById('lateInput')) {
            document.getElementById('lateInput').value = data.latecomers || "";
        }

        // 청소 당번 파싱 및 세팅
        const rawCleaning = data.cleaning || "";
        const nums = rawCleaning.match(/\d+/g) || [];
        const pNums = ["01", "01", "01", "01"]; // 기본값
        
        nums.forEach((n, idx) => {
            if (idx < 4) pNums[idx] = n.length === 1 ? n.padStart(2, '0') : n;
        });

        // [수정 완료] mop1 오타 수정 및 안전한 할당
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.value = val;
        };

        setVal('sweep1', pNums[0]);
        setVal('sweep2', pNums[1]);
        setVal('mop1', pNums[2]); // 정상적으로 mop1에 할당
        setVal('mop2', pNums[3]);

        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.style.display = 'none';
                overlay.classList.remove('loading-failed');
            }, 500);
        }
    } catch (err) {
        clearTimeout(loadTimeout);
        console.error("Fetch Error:", err);
        if (overlay) {
            document.getElementById('loading-text').innerText = "DATA RENDER ERROR: " + err.message;
            overlay.classList.add('loading-failed');
        }
    }
}

/**
 * 데이터 저장 (POST) - 엔드포인트: /api/auth/write
 */
async function saveDashboard() {
    const saveBtn = document.getElementById('saveBtn');
    const lateRaw = document.getElementById('lateInput').value;
    
    const s1 = document.getElementById('sweep1').value;
    const s2 = document.getElementById('sweep2').value;
    const m1 = document.getElementById('mop1').value;
    const m2 = document.getElementById('mop2').value;
    const cleaningStr = `${s1}, ${s2} / ${m1}, ${m2}`;

    if (!confirm("변경사항을 저장하시겠습니까?")) return;

    saveBtn.disabled = true;
    saveBtn.innerText = "저장 중...";

    try {
        const response = await fetch(`${DATA_SERVER_URL}/api/auth/write`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                target: 'dashboard',
                latecomers: lateRaw,
                cleaning: cleaningStr
            })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            alert("서버에 성공적으로 저장되었습니다!");
        } else {
            throw new Error(result.message || "서버 저장 응답 실패");
        }
    } catch (err) {
        console.error("Save Error:", err);
        alert("저장 실패: " + err.message);
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerText = "설정 저장하기";
    }
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}