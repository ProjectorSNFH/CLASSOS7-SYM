/* -------------------------------------------------------------------------- */
/* 1. 쿠키 관리 유틸리티                                                        */
/* -------------------------------------------------------------------------- */
// 쿠키 저장
function setCookie(name, value, days) {
  let expires = "";
  if (days) {
    let date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

// 쿠키 가져오기
function getCookie(name) {
  let nameEQ = name + "=";
  let ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/* 2. 인증 및 페이지 가드 (로그인 상태 관리)                                     */
/* -------------------------------------------------------------------------- */
// 로그아웃 함수
/* script.js */

function logout() {
    // 1. 확인창 띄우기 (선택 사항)
    if (!confirm("로그아웃 하시겠습니까?")) return;

    // 2. 로컬 스토리지 / 세션 스토리지 삭제
    localStorage.clear();
    sessionStorage.clear();

    // 3. 쿠키 삭제 (로그인 시 사용했을 수 있는 모든 쿠키 파기)
    // 쿠키는 만료일(expires)을 과거로 설정하여 삭제합니다.
    document.cookie.split(";").forEach(function(c) {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    // 4. 로그인 페이지(index.html)로 리다이렉트
    // 경로가 상위 폴더나 하위 폴더일 수 있으니 상황에 맞게 조절하세요.
    window.location.href = "../index.html"; 
}

// [즉시 실행] 페이지 접속 권한 확인    
// script.js 내부
(function checkPageAuth() {
  const isLoggedIn = document.cookie.includes("isLoggedIn=true");
  const path = location.pathname;
  const pageName = path.split("/").pop();

  // 로그인 페이지인지 확인 (index.html 또는 빈값)
  const isLoginPage = pageName === "index.html" || pageName === "";

  if (isLoginPage) {
    // 로그인 되어 있는데 로그인 페이지 오면 대시보드로
    if (isLoggedIn) {
      location.href = "HTML/dashboard.html";
    }
  } else {
    // 서비스 페이지인데 로그인 안 되어 있으면 index로
    if (!isLoggedIn) {
      // HTML 폴더 안에 있다면 ../index.html, 루트에 있다면 index.html
      const prefix = path.includes('/HTML/') ? '../' : '';
      location.href = prefix + "index.html";
    }
  }
})();

/* -------------------------------------------------------------------------- */
/* 3. 공통 UI 인터랙션                                                         */
/* -------------------------------------------------------------------------- */
let lastScrollY = window.scrollY;

document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const footer = document.querySelector('footer');

  // 1. 다크/라이트 모드 초기 설정 (쿠키 기반)
  const savedMode = getCookie("themeMode");
  if (savedMode === "light") {
    body.classList.add('light-mode');
  }

  // 2. 계정 드롭다운 제어
  const accBtn = document.getElementById('accountBtn');
  const accDropdown = document.getElementById('accountDropdown');
  const mobileOverlay = document.getElementById('mobileNavOverlay');

  if (accBtn && accDropdown) {
    accBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      // 계정 메뉴 열 때 모바일 삼단바 메뉴는 닫기
      if (mobileOverlay) {
        mobileOverlay.classList.remove('show');
        const mobileBtn = document.getElementById('mobileMenuBtn');
        if (mobileBtn) mobileBtn.classList.remove('active');
      }
      accDropdown.style.display = accDropdown.style.display === 'block' ? 'none' : 'block';
    });

    // 다른 곳 클릭 시 드롭다운 닫기
    document.addEventListener('click', () => {
      accDropdown.style.display = 'none';
    });
  }

  // 3. 모바일 삼단바 메뉴 제어
  const mobileBtn = document.getElementById('mobileMenuBtn');
  if (mobileBtn && mobileOverlay) {
    mobileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      // 모바일 메뉴 열 때 계정 드롭다운은 닫기
      if (accDropdown) accDropdown.style.display = 'none';

      mobileBtn.classList.toggle('active');
      mobileOverlay.classList.toggle('show');
    });

    // 모바일 오버레이 바깥 클릭 시 닫기
    document.addEventListener('click', (e) => {
      if (!mobileOverlay.contains(e.target) && !mobileBtn.contains(e.target)) {
        mobileOverlay.classList.remove('show');
        mobileBtn.classList.remove('active');
      }
    });
  }

  // 4. 스크롤 감지 (푸터 숨기기/보이기)
  if (footer) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > lastScrollY) {
        footer.classList.add('hide');
      } else {
        footer.classList.remove('hide');
      }
      lastScrollY = window.scrollY;
    });
  }
});

// 테마 토글 함수
function toggleTheme() {
  const body = document.body;
  body.classList.toggle('light-mode');

  // 상태 저장
  const mode = body.classList.contains('light-mode') ? "light" : "dark";
  setCookie("themeMode", mode, 30);
}

function toggleSeasonalMode() {
    const body = document.body;
    
    // 1. 클래스 토글 (켜짐/꺼짐 상태만 전환)
    const isOn = body.classList.toggle('seasonal-mode');
    
    // 2. 쿠키 저장 (텍스트 변경 로직 삭제함)
    setCookie("seasonalMode", isOn ? "true" : "false", 30);
}

// 페이지 로드 시 상태 복구
document.addEventListener('DOMContentLoaded', () => {
    if (getCookie("seasonalMode") === "true") {
        document.body.classList.add('seasonal-mode');
    }
});

// script.js (모든 페이지 공통)
const API_BASE_URL = "https://above-gayel-hyperstylelife-258ff702.koyeb.app";

// 쿠키에서 특정 값을 가져오는 함수
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

// 로그아웃 처리 함수
function forceLogout(message) {
    alert(message || "세션이 만료되었거나 관리자에 의해 종료되었습니다.");
    // 모든 쿠키 삭제
    document.cookie = "isLoggedIn=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "userName=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "userRole=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    // 로그인 페이지로 이동
    window.location.replace("/index.html"); // 경로에 맞게 수정
}

// 실시간 세션 체크 (5초마다 실행)
async function checkSession() {
    // 로그인 상태일 때만 체크
    if (getCookie('isLoggedIn') === 'true') {
        const userName = getCookie('userName');
        
        try {
            // 서버의 /test 혹은 세션 확인 전용 API에 내 이름을 보냄
            const response = await fetch(`${API_BASE_URL}/test?user=${userName}`);
            const data = await response.json();

            // 서버 응답에 내 세션이 없거나 실패라면 로그아웃
            if (data.connection !== 1) {
                forceLogout("서버 연결에 문제가 발생했습니다.");
            }
            
            // 만약 서버에서 중복 로그인이나 강제 로그아웃을 구현했다면 
            // 아래처럼 activeSessions에 내가 있는지 확인하는 로직이 필요합니다.
            if (data.activeSessions && !data.activeSessions.includes(userName)) {
                forceLogout("다른 기기에서 로그인했거나 관리자가 로그아웃시켰습니다.");
            }

        } catch (error) {
            console.error("세션 체크 중 에러:", error);
            // 서버가 완전히 죽었을 때도 로그아웃 시킬지 결정 (보통은 유지하되 경고만 띄움)
        }
    }
}

// 5초마다 실행
setInterval(checkSession, 5000);