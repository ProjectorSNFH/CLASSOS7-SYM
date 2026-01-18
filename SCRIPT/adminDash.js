const DATA_SERVER_URL = "https://classos7-dx.vercel.app";

document.addEventListener('DOMContentLoaded', () => {
    // 1. 권한 체크 (adminAuth.js에 정의된 함수 호출 권장)
    // 권한 'A'(총관리자) 또는 'T'(대시보드 관리자)만 접근 허용
    const role = getCookie('userRole');
    if (role !== 'A' && role !== 'T') {
        alert("접근 권한이 없습니다.");
        window.location.href = "../dashboard.html";
        return;
    }

    // 권한 확인 완료 시 화면 표시
    document.getElementById('admin-main').style.display = 'block';

    // 2. 초기화
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

// 1~30번 드롭박스 채우기
function initSelectBoxes() {
    const selects = ['sweep1', 'sweep2', 'mop1', 'mop2'];
    selects.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        for (let i = 1; i <= 30; i++) { // 기본 30명 기준
            const num = i < 10 ? `0${i}` : `${i}`;
            const option = document.createElement('option');
            option.value = num;
            option.textContent = `${num}번`;
            el.appendChild(option);
        }
    });
}

// 서버에서 현재 데이터 가져오기 (GET)
async function fetchCurrentAdminData(loadTimeout) {
    const overlay = document.getElementById('loading-overlay');
    try {
        const response = await fetch(`${DATA_SERVER_URL}/api/auth/import?target=dashboard`);
        if (!response.ok) throw new Error('서버 로드 실패');
        
        const data = await response.json();
        
        // [수정] 데이터가 도착하면 즉시 타임아웃부터 해제
        clearTimeout(loadTimeout);

        // 1. 지각생 세팅
        document.getElementById('lateInput').value = data.latecomers || "";

        // 2. 청소 당번 세팅 (더 안전한 파싱)
        const rawCleaning = data.cleaning || "";
        // 숫자가 4개가 안 될 경우를 대비해 기본값 ["01", "01", "01", "01"] 준비
        const nums = rawCleaning.match(/\d+/g) || [];
        const pNums = ["01", "01", "01", "01"]; // 기본값
        
        nums.forEach((n, idx) => {
            if (idx < 4) pNums[idx] = n.length === 1 ? n.padStart(2, '0') : n;
        });

        // 요소가 존재하는지 확인 후 세팅 (오타 방지)
        if(document.getElementById('sweep1')) document.getElementById('sweep1').value = pNums[0];
        if(document.getElementById('sweep2')) document.getElementById('sweep2').value = pNums[1];
        if(document.getElementById('mop1')) document.getElementById('mop2').value = pNums[2] || "01"; // 오타 방지용
        if(document.getElementById('mop2')) document.getElementById('mop2').value = pNums[3];

        // 3. [중요] 모든 데이터 세팅이 끝난 후 오버레이 제거
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.style.display = 'none';
                overlay.classList.remove('loading-failed'); // 혹시 모를 클래스 잔상 제거
            }, 500);
        }
    } catch (err) {
        clearTimeout(loadTimeout);
        console.error("화면 렌더링 중 에러 발생:", err); // 에러 원인을 콘솔에 찍어보세요
        
        if (overlay) {
            document.getElementById('loading-text').innerText = "DATA RENDER ERROR: " + err.message;
            overlay.classList.add('loading-failed');
        }
    }
}

// 데이터 저장하기 (POST)
async function saveDashboard() {
    const saveBtn = document.getElementById('saveBtn');
    const lateRaw = document.getElementById('lateInput').value;
    
    // 청소 당번 문자열 조립 (예: "01, 02 / 03, 04")
    const s1 = document.getElementById('sweep1').value;
    const s2 = document.getElementById('sweep2').value;
    const m1 = document.getElementById('mop1').value;
    const m2 = document.getElementById('mop2').value;
    const cleaningStr = `${s1}, ${s2} / ${m1}, ${m2}`;

    if (!confirm("데이터를 서버에 저장할까요?")) return;

    saveBtn.disabled = true;
    saveBtn.innerText = "저장 중...";

    try {
        // 데이터 서버의 export 엔드포인트로 데이터 전송 (가정)
        const response = await fetch(`${DATA_SERVER_URL}/api/auth/export`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                target: 'dashboard',
                latecomers: lateRaw,
                cleaning: cleaningStr
            })
        });

        if (response.ok) {
            alert("서버에 성공적으로 반영되었습니다!");
        } else {
            throw new Error("저장 실패");
        }
    } catch (err) {
        alert("저장 중 오류가 발생했습니다: " + err.message);
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