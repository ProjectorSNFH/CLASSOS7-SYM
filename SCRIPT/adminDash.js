/**
 * adminDash.js
 * 대시보드(지각생, 청소당번) 관리 프론트엔드 로직
 * 연결: adminDash.html <-> 데이터 서버(Vercel) <-> Supabase
 */

// 1. 데이터 서버 주소 설정 (배포된 Vercel 서버 주소)
const DATA_SERVER_URL = "https://classos7-dx.vercel.app";

document.addEventListener('DOMContentLoaded', () => {
    const role = getCookie('userRole');
    if (role !== 'A' && role !== 'T') {
        alert("접근 권한이 없습니다.");
        window.location.href = "../index.html";
        return;
    }

    initSelectBoxes();
    fetchDashboardData();
});

function initSelectBoxes() {
    const selects = ['sweep1', 'sweep2', 'mop1', 'mop2'];
    selects.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
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

async function fetchDashboardData() {
    // 1. 로딩 요소 가져오기 (클래스명 점검 필수)
    const overlay = document.querySelector('.dot-overlay');
    
    try {
        // 로딩 시작 시점에 명시적으로 표시 (HTML/CSS 설정에 따라 다를 수 있음)
        if (overlay) overlay.style.display = 'block';

        const response = await fetch(`${DATA_SERVER_URL}/api/auth/import?target=dashboard`);
        if (!response.ok) throw new Error(`HTTP 에러! 상태: ${response.status}`);

        const data = await response.json();
        console.log("받은 데이터:", data); // 디버깅용

        // 2. 데이터 안전하게 채우기 (요소가 없을 경우를 대비한 옵셔널 체이닝)
        if (document.getElementById('lateInput')) {
            document.getElementById('lateInput').value = data.latecomers || "";
        }

        // 3. 청소 당번 파싱 (에러 방지 로직 강화)
        const rawCleaning = data.cleaning || "";
        const nums = rawCleaning.match(/\d+/g) || [];
        const pNums = ["01", "01", "01", "01"];
        
        nums.forEach((n, idx) => {
            if (idx < 4) pNums[idx] = n.padStart(2, '0');
        });

        // 요소 존재 여부 확인 후 값 세팅
        const elSweep1 = document.getElementById('sweep1');
        const elSweep2 = document.getElementById('sweep2');
        const elMop1 = document.getElementById('mop1');
        const elMop2 = document.getElementById('mop2');

        if(elSweep1) elSweep1.value = pNums[0] || "01";
        if(elSweep2) elSweep2.value = pNums[1] || "01";
        if(elMop1) elMop1.value = pNums[2] || "01";
        if(elMop2) elMop2.value = pNums[3] || "01";

    } catch (error) {
        console.error("데이터 렌더링 중 에러 발생:", error);
        // 사용자에게 에러 알림 (선택 사항)
        // alert("데이터 로드 중 오류가 발생했습니다.");
    } finally {
        // [중요] 성공하든 실패하든 무조건 로딩 화면 제거
        if (overlay) {
            console.log("로딩 화면 제거 시도");
            overlay.style.display = 'none';
            overlay.style.opacity = '0'; // 투명도 조절이 필요할 경우
            // 만약 CSS에서 transition을 쓴다면 아래처럼 처리 가능
            setTimeout(() => overlay.style.display = 'none', 500);
        }
    }
}

// ... 나머지 saveDashboard, getCookie 함수는 동일 ...

/**
 * [POST] 수정된 데이터를 서버에 저장하기
 * API: /api/auth/write
 */
async function saveDashboard() {
    const saveBtn = document.querySelector('.save-btn'); // 저장 버튼

    // 1. 입력값 가져오기
    const lateRaw = document.getElementById('lateInput').value;
    
    const s1 = document.getElementById('sweep1').value;
    const s2 = document.getElementById('sweep2').value;
    const m1 = document.getElementById('mop1').value;
    const m2 = document.getElementById('mop2').value;
    
    // 2. 청소 당번 문자열 조립 (형식: "01, 02 / 03, 04")
    const cleaningStr = `${s1}, ${s2} / ${m1}, ${m2}`;

    // 사용자 확인
    if (!confirm("현재 설정으로 대시보드를 수정하시겠습니까?")) return;

    // 버튼 비활성화 (중복 클릭 방지)
    saveBtn.disabled = true;
    saveBtn.innerText = "저장 중...";

    try {
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

        if (response.ok && result.success) {
            alert("성공적으로 저장되었습니다!");
            // 필요 시 페이지 새로고침: location.reload();
        } else {
            throw new Error(result.message || "서버 저장 실패");
        }

    } catch (error) {
        console.error("저장 오류:", error);
        alert("저장 중 오류가 발생했습니다: " + error.message);
    } finally {
        // 버튼 상태 복구
        saveBtn.disabled = false;
        saveBtn.innerText = "설정 저장하기";
    }
}

/**
 * 쿠키 값 가져오는 유틸리티 함수
 */
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// HTML의 onclick="saveDashboard()" 에서 호출할 수 있도록 window 객체에 등록 (모듈 방식이 아닐 경우 생략 가능하나 안전을 위해)
window.saveDashboard = saveDashboard;