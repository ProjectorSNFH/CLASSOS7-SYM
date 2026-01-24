/**
 * adminDash.js (전체 코드)
 * 기능: 데이터 불러오기 상태 표시, 대시보드 데이터 로드 및 저장
 */

// [환경설정] 데이터 서버 URL
const DATA_SERVER_URL = "https://classos7-dx.vercel.app";

document.addEventListener('DOMContentLoaded', () => {
    // 1. 권한 체크 (쿠키 기반)
    const role = getCookie('userRole');
    if (role !== 'A' && role !== 'T') {
        alert("접근 권한이 없습니다.");
        window.location.href = "../index.html"; // 권한 없으면 메인으로 이동
        return;
    }

    // 2. UI 초기화 및 데이터 서버로부터 데이터 호출
    initSelectBoxes();
    fetchDashboardData();
});

/**
 * 1~30번 드롭박스 옵션을 생성하는 함수
 */
function initSelectBoxes() {
    const selects = ['sweep1', 'sweep2', 'mop1', 'mop2'];
    selects.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;

        // 초기화
        el.innerHTML = '';

        // 로딩 중 상태를 첫 번째 옵션으로 추가
        const loadingOpt = document.createElement('option');
        loadingOpt.textContent = "로딩중..";
        loadingOpt.value = "";
        el.appendChild(loadingOpt);

        // 1번부터 30번까지 옵션 생성
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
 * [GET] 서버에서 대시보드 데이터(지각생, 청소당번) 불러오기
 */
async function fetchDashboardData() {
    const lateInput = document.getElementById('lateInput');

    // 로딩 시작 상태 표시
    if (lateInput) {
        lateInput.value = "데이터를 서버에서 불러오는 중입니다...";
        lateInput.disabled = true; // 불러오는 동안 수정 방지
    }

    try {
        // 데이터 서버의 import.js 호출
        const response = await fetch(`${DATA_SERVER_URL}/api/auth/import?target=dashboard`);

        if (!response.ok) {
            throw new Error(`서버 응답 오류 (상태코드: ${response.status})`);
        }

        const data = await response.json();
        console.log("서버로부터 받은 데이터:", data);

        // 1. 지각생 데이터 입력창에 반영
        if (lateInput) {
            lateInput.value = data.latecomers || "";
            lateInput.disabled = false; // 로드 완료 후 입력 가능하게 변경
        }

        // 2. 청소 당번 데이터 파싱 및 셀렉트 박스 반영
        const rawCleaning = data.cleaning || "";
        // 문자열에서 숫자(01, 02 등)만 추출
        const nums = rawCleaning.match(/\d+/g) || [];

        // 데이터가 부족할 경우를 대비해 4개의 기본값 준비
        const pNums = ["01", "01", "01", "01"];
        nums.forEach((n, idx) => {
            if (idx < 4) {
                // 한 자리 숫자일 경우 앞에 0을 붙여서 01, 02 형식 유지
                pNums[idx] = n.length === 1 ? n.padStart(2, '0') : n;
            }
        });

        // 각각의 셀렉트 박스 요소에 값 할당
        if (document.getElementById('sweep1')) document.getElementById('sweep1').value = pNums[0];
        if (document.getElementById('sweep2')) document.getElementById('sweep2').value = pNums[1];
        if (document.getElementById('mop1')) document.getElementById('mop1').value = pNums[2];
        if (document.getElementById('mop2')) document.getElementById('mop2').value = pNums[3];

    } catch (error) {
        console.error("데이터 로드 중 에러 발생:", error);
        if (lateInput) {
            lateInput.value = "데이터를 불러오지 못했습니다. 새로고침 해주세요.";
            lateInput.style.color = "red";
        }
        alert("데이터 로드 오류: " + error.message);
    }
}

/**
 * [POST] 수정한 데이터를 서버에 저장
 */
async function saveDashboard() {
    const saveBtn = document.querySelector('.save-btn');
    const lateInput = document.getElementById('lateInput');

    // 현재 입력값 및 선택값 수집
    const lateRaw = lateInput ? lateInput.value : "";
    const s1 = document.getElementById('sweep1').value;
    const s2 = document.getElementById('sweep2').value;
    const m1 = document.getElementById('mop1').value;
    const m2 = document.getElementById('mop2').value;

    // 서버 저장 형식에 맞게 문자열 조립
    const cleaningStr = `${s1}, ${s2} / ${m1}, ${m2}`;

    if (!confirm("변경사항을 저장하시겠습니까?")) return;

    // 저장 버튼 비활성화
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerText = "저장 중...";
    }

    try {
        const response = await fetch(`${DATA_SERVER_URL}/api/auth/write`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-role': userRole // 서버로 내 권한 정보를 보냄
            },
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
            throw new Error(result.message || "저장 실패");
        }

    } catch (error) {
        console.error("저장 중 에러 발생:", error);
        alert("저장 오류: " + error.message);
    } finally {
        // 버튼 상태 복구
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerText = "설정 저장하기";
        }
    }
}

/**
 * 쿠키 값을 가져오는 함수
 */
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}