// [설정] 데이터 서버 URL (배포된 Vercel 데이터 서버 주소)
const DATA_SERVER_URL = "https://classos7-dx.vercel.app"; 

document.addEventListener('DOMContentLoaded', () => {
    // 1. 권한 체크 (adminAuth.js가 있다면 거기서 처리하겠지만, 여기서도 안전장치)
    // 쿠키 확인 로직은 기존 adminAuth.js에 있다고 가정하고 생략하거나 간단히 체크
    
    // 2. 초기화
    initSelectBoxes(); // 드롭박스 옵션 생성
    
    // 3. 로딩 화면 표시 (CSS에 #loading-overlay가 있다고 가정)
    const overlay = document.querySelector('.dot-overlay'); 
    if(overlay) overlay.style.display = 'block';

    // 4. 데이터 서버에서 현재 값 불러오기
    fetchDashboardData();
});

// 1~30번 드롭박스 채우기
function initSelectBoxes() {
    const selects = ['sweep1', 'sweep2', 'mop1', 'mop2'];
    selects.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        
        // 초기화 (중복 방지)
        el.innerHTML = '';
        
        for (let i = 1; i <= 30; i++) {
            const num = i < 10 ? `0${i}` : `${i}`;
            const option = document.createElement('option');
            option.value = num;
            option.textContent = `${num}번`;
            el.appendChild(option);
        }
    });
}

// [GET] 데이터 불러오기
async function fetchDashboardData() {
    try {
        // import.js 호출
        const response = await fetch(`${DATA_SERVER_URL}/api/auth/import?target=dashboard`);
        
        if (!response.ok) throw new Error("서버 연결 실패");
        
        const data = await response.json();
        
        // 1. 지각생 데이터 적용
        const lateInput = document.getElementById('lateInput');
        if (lateInput) {
            lateInput.value = data.latecomers || "";
        }

        // 2. 청소 당번 데이터 파싱 및 적용
        // 서버 데이터 예시: "01, 02 / 03, 04" -> 숫자만 추출
        const rawCleaning = data.cleaning || "";
        const nums = rawCleaning.match(/\d+/g) || ["01", "01", "01", "01"];
        
        // 부족한 숫자는 "01"로 채움
        const pNums = nums.map(n => n.length === 1 ? n.padStart(2, '0') : n);
        while(pNums.length < 4) pNums.push("01");

        // 각 셀렉트 박스에 값 할당
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.value = val;
        };

        setVal('sweep1', pNums[0]);
        setVal('sweep2', pNums[1]);
        setVal('mop1', pNums[2]);
        setVal('mop2', pNums[3]);

    } catch (error) {
        console.error("데이터 로드 오류:", error);
        alert("데이터를 불러오는 중 오류가 발생했습니다.\n" + error.message);
    } finally {
        // 로딩 화면 해제
        const overlay = document.querySelector('.dot-overlay');
        if(overlay) overlay.style.display = 'none';
    }
}

// [POST] 데이터 저장하기
async function saveDashboard() {
    const saveBtn = document.querySelector('.save-btn');
    
    // 1. 입력값 가져오기
    const lateRaw = document.getElementById('lateInput').value;
    
    const s1 = document.getElementById('sweep1').value;
    const s2 = document.getElementById('sweep2').value;
    const m1 = document.getElementById('mop1').value;
    const m2 = document.getElementById('mop2').value;
    
    // 2. 청소 당번 포맷팅 (예: "01, 02 / 03, 04")
    const cleaningStr = `${s1}, ${s2} / ${m1}, ${m2}`;

    if (!confirm("현재 설정으로 대시보드를 수정하시겠습니까?")) return;

    saveBtn.disabled = true;
    saveBtn.innerText = "저장 중...";

    try {
        // write.js 호출
        const response = await fetch(`${DATA_SERVER_URL}/api/auth/write`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
                target: 'dashboard',
                latecomers: lateRaw,
                cleaning: cleaningStr
            })
        });

        const result = await response.json();

        if (response.ok) {
            alert("성공적으로 저장되었습니다!");
            // 필요하다면 새로고침: location.reload();
        } else {
            throw new Error(result.error || "저장 실패");
        }

    } catch (error) {
        console.error("저장 오류:", error);
        alert("저장 중 오류가 발생했습니다: " + error.message);
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerText = "설정 저장하기";
    }
}