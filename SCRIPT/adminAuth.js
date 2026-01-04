/**
 * adminAuth.js
 * 관리자 전용 페이지 접속 권한 확인
 */
(function checkAdminPermission() {
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }

    const isLoggedIn = getCookie("isLoggedIn") === "true";
    const userRole = getCookie("userRole"); // 'A', 'T', 'N' 등

    // 1. 로그인이 안 되어 있거나, 역할(Role)이 일반 학생('N')인 경우
    if (!isLoggedIn || userRole === "N") {
        alert("권한이 없습니다. 관리자만 접근 가능합니다.");
        
        // 경로 계산 (관리자 페이지 위치에 따라 수정이 필요할 수 있음)
        // 현재 위치가 HTML 폴더 내부라면 ../dashboard.html, 루트라면 dashboard.html
        const path = window.location.pathname;
        const prefix = path.includes('/HTML/') ? '' : 'HTML/';
        
        window.location.replace(window.location.origin + "/" + prefix + "dashboard.html");
    }
    console.log(userRole);
    console.log(userRole === "N");
})();