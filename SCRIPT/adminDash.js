/**
 * adminDash.js
 * 대시보드(지각생, 청소당번) 관리 프론트엔드 로직
 * 연결: adminDash.html <-> 데이터 서버(Vercel) <-> Supabase
 */

// 1. 데이터 서버 주소 설정 (배포된 Vercel 서버 주소)
const DATA_SERVER_URL = "https://classos7-dx.vercel.app";

document.addEventListener('DOMContentLoaded', () => {
    // 2. 권한 체크 (쿠키 확인)
    const role = getCookie('userRole'); // 쿠키에서 userRole 가져오기
    
    // 권한이 'A'(총관리자) 또는 'T'(대시보드 관리자)가 아니면 차단
    if (role !== 'A' && role !== 'T') {
        alert("접근 권한이 없습니다.");
        window.location.href = "../index.html"; // 메인으로 튕겨냄
        return;
    }

    // 3. UI 초기화 및 데이터 로드 시작
    initSelectBoxes();       // 번호 선택박스(1~30) 생성
    fetchDashboardData();    // 서버에서 현재 데이터 불러오기
});

/**
 * 1번부터 30번까지의 옵션을 드롭박스에 추가하는 함수
 */
function initSelectBoxes() {
    const selects = ['sweep1', 'sweep2', 'mop1', 'mop2'];
    
    selects.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;

        // 기존 옵션 초기화
        el.innerHTML = '';

        for (let i = 1; i <= 30; i++) {
            const num = i < 10 ? `0${i}` : `${i}`; // 1 -> "01" 로 변환
            const option = document.createElement('option');
            option.value = num;
            option.textContent = `${num}번`;
            el.appendChild(option);
        }
    });
}

/**
 * [GET] 서버에서 현재 대시보드 데이터 불러오기
 * API: /api/auth/import?target=dashboard
 */
async function fetchDashboardData() {
    // 로딩 오버레이 제어 (HTML에 .dot-overlay가 있다고 가정)
    const overlay = document.querySelector('.dot-overlay');
    if (overlay) overlay.style.display = 'block';

    try {
        const response = await fetch(`${DATA_SERVER_URL}/api/auth/import?target=dashboard`);
        
        if (!response.ok) {
            throw new Error(`서버 응답 오류: ${response.status}`);
        }

        const data = await response.json();

        // 1. 지각생 명단 적용
        const lateInput = document.getElementById('lateInput');
        if (lateInput) {
            lateInput.value = data.latecomers || ""; 
        }

        // 2. 청소 당번 파싱 및 적용
        // 서버 데이터 예시: "01, 02 / 03, 04" -> 숫자만 추출하여 배열로 만듦
        const rawCleaning = data.cleaning || "";
        // 정규식으로 숫자만 모두 추출 (없으면 빈 배열)
        let nums = rawCleaning.match(/\d+/g) || [];
        
        // 데이터가 모자랄 경우를 대비해 기본값 "01"로 채움 (최소 4개 필요)
        const pNums = ["01", "01", "01", "01"];
        nums.forEach((n, idx) => {
            if (idx < 4) {
                // "1" -> "01"로 변환 (패딩)
                pNums[idx] = n.length === 1 ? n.padStart(2, '0') : n;
            }
        });

        // 각 select 박스에 값 할당
        const setSelectValue = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.value = val;
        };

        setSelectValue('sweep1', pNums[0]);
        setSelectValue('sweep2', pNums[1]);
        setSelectValue('mop1', pNums[2]);
        setSelectValue('mop2', pNums[3]);

    } catch (error) {
        console.error("데이터 로드 실패:", error);
        alert("데이터를 불러오는 데 실패했습니다.\n" + error.message);
    } finally {
        // 로딩 화면 끄기
        if (overlay) overlay.style.display = 'none';
    }
}

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