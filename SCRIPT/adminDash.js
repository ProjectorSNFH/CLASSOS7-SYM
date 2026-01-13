// 1. 초기 더미 데이터 (서버에서 불러올 값 대용)
const currentConfig = {
    lateStudents: ["김철수", "이영희"],
    cleaningDuty: {
        sweeping: ["06", "07"],
        mopping: ["04", "05"]
    },
    maxStudentNumber: 30 // 학급 인원수 (드롭박스 범위)
};

document.addEventListener('DOMContentLoaded', () => {
    initSelectBoxes(); // 드롭박스 숫자 채우기
    loadCurrentData(); // 기존 데이터 불러와서 입력창에 세팅
});

// 드롭박스(1~30번) 생성 함수
function initSelectBoxes() {
    const selects = ['sweep1', 'sweep2', 'mop1', 'mop2'];
    
    selects.forEach(id => {
        const el = document.getElementById(id);
        for (let i = 1; i <= currentConfig.maxStudentNumber; i++) {
            const num = i < 10 ? `0${i}` : `${i}`; // 01, 02... 형식
            const option = document.createElement('option');
            option.value = num;
            option.textContent = `${num}번`;
            el.appendChild(option);
        }
    });
}

// 기존 데이터 세팅 함수
function loadCurrentData() {
    // 지각생 텍스트 필드 세팅 (배열 -> 콤마 문자열)
    document.getElementById('lateInput').value = currentConfig.lateStudents.join(', ');

    // 청소 당번 세팅
    document.getElementById('sweep1').value = currentConfig.cleaningDuty.sweeping[0];
    document.getElementById('sweep2').value = currentConfig.cleaningDuty.sweeping[1];
    document.getElementById('mop1').value = currentConfig.cleaningDuty.mopping[0];
    document.getElementById('mop2').value = currentConfig.cleaningDuty.mopping[1];
}

// 저장 버튼 클릭 시 실행
function saveDashboard() {
    // 1. 지각생 데이터 가공 (콤마 기준 분리 및 공백 제거)
    const lateRaw = document.getElementById('lateInput').value;
    const lateProcessed = lateRaw.split(',')
                                 .map(name => name.trim())
                                 .filter(name => name !== "");

    // 2. 청소 당번 데이터 수집
    const updatedDuty = {
        sweeping: [
            document.getElementById('sweep1').value,
            document.getElementById('sweep2').value
        ],
        mopping: [
            document.getElementById('mop1').value,
            document.getElementById('mop2').value
        ]
    };

    // 3. 콘솔에 출력 (추후 여기서 서버 API를 호출)
    console.log("저장될 지각생:", lateProcessed);
    console.log("저장될 청소당번:", updatedDuty);

    alert("대시보드 설정이 성공적으로 저장되었습니다!");
    // window.location.href = "admin.html"; // 저장 후 복귀하고 싶을 때 활성화
}

function userRoleCheck() {

    const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    };
    const userRole = getCookie("userRole"); // 'A', 'T', 'N'

    if (!userRole === 'A' || !userRole === 'T') {
        window.location.replace("../dashboard.html");
    }
}

userRoleCheck();