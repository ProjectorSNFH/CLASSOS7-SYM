/**
 * adminAuth.js
 * 관리자 전용 페이지 진입 전 권한을 즉시 확인합니다.
 */

// 1. 권한 확인 함수 정의
function checkAdminAccess() {
    // 내부 쿠키 읽기 함수
    const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    };

    const isLoggedIn = getCookie("isLoggedIn") === "true";
    const userRole = getCookie("userRole"); // 'A', 'T', 'N'

    console.log("[AUTH DEBUG] 현재 역할:", userRole);

    // 2. 검사 로직
    // 로그인이 안 되어 있거나, 역할이 학생('N')이면 차단
    if (!isLoggedIn || userRole === "N") {
        window.location.replace("../HTML/dashboard.html");
    }
}

// 3. 파일 로드 즉시 실행
checkAdminAccess();