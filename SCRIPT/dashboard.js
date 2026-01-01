document.addEventListener('DOMContentLoaded', () => {
    // 1. 쿠키에서 사용자 정보 읽기
    const userCookie = getCookie('user_info');

    if (!userCookie) {
        // 로그인 정보가 없으면 로그인 페이지로 튕기기
        window.location.replace("../index.html");
        return;
    }

    const userData = JSON.parse(decodeURIComponent(userCookie));

    // 2. 대시보드 데이터 구조 생성 (사용자 정보는 쿠키에서, 나머지는 임시 유지)
    const serverData = {
        user: {
            name: userData.name,
            grade: 1, // 학년/반은 현재 서버 데이터에 없으므로 일단 고정하거나 데이터 추가 필요
            class: 5,
            number: userData.number,
            role: userData.role === 'A' ? '관리자' : (userData.role === 'T' ? '선생님' : '학생')
        },
        lateStudents: ["김철수", "이영희"], // 나중에 서버 API 만들어서 채울 부분
        cleaningDuty: {
            sweeping: ["06", "07"],
            mopping: ["04", "05"]
        },
        allNotices: [
            { id: 1, title: "수학: 미분과 적분 단원평가", date: "2026-05-15", category: "수행" },
            { id: 2, title: "영어: 영미문학 에세이 제출", date: "2026-05-20", category: "과제" },
            { id: 3, title: "과학: 화학 반응 실험 보고서", date: "2026-01-05", category: "수행" },
            { id: 5, title: "체육: 배드민턴 실기 테스트", date: "2026-01-10", category: "수행" }
        ]
    };

    renderDashboard(serverData);

    // 3. 실시간 세션 감시 시작 (5초마다)
    setInterval(checkSessionStatus, 5000);
});

// 쿠키 읽기 함수
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

// 실시간 세션 체크 함수 (서버에서 내 세션이 지워졌는지 확인)
async function checkSessionStatus() {
    const userCookie = getCookie('user_info');
    if (!userCookie) return;

    const userData = JSON.parse(decodeURIComponent(userCookie));
    const SERVER_URL = "https://above-gayel-hyperstylelife-258ff702.koyeb.app";

    try {
        const response = await fetch(`${SERVER_URL}/test`);
        const data = await response.json();

        // 1. 서버가 꺼져있거나(connection: 0), 2. 내 세션이 명단에 없으면 로그아웃
        // 서버의 activeSessions에 이름이 포함되어 있는지 확인
        if (data.connection === 0 || !data.activeSessions.includes(userData.name)) {
            alert("세션이 종료되었습니다. 다시 로그인해주세요.");
            // 쿠키 삭제
            document.cookie = "isLoggedIn=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            document.cookie = "user_info=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            window.location.replace("../index.html");
        }
    } catch (error) {
        console.error("세션 체크 실패:", error);
    }
}

// --- 아래 renderDashboard 및 getDDayCount 함수는 기존 코드 유지 ---
function getDDayCount(targetDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    const diff = target - today;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function renderDashboard(data) {
    document.getElementById('display-name').innerText = data.user.name;
    document.getElementById('display-meta').innerText =
        `${data.user.grade}학년 ${data.user.class}반 ${data.user.number}번 · ${data.user.role}`;

    // ... (이하 동일)
    const lateListContainer = document.getElementById('late-list');
    lateListContainer.innerHTML = data.lateStudents.map(name =>
        `<span class="dot-badge">${name}</span>`
    ).join('');

    const cleaningContainer = document.getElementById('duty-container');
    cleaningContainer.innerHTML = `
        <div style="border-left: 1px solid var(--border-color); padding-left: 20px;">
            <p style="color: #666; font-size: 0.8rem;">쓸기</p>
            <div class="data-value">${data.cleaningDuty.sweeping.join(', ')}</div>
        </div>
        <div style="border-left: 1px solid var(--border-color); padding-left: 20px;">
            <p style="color: #666; font-size: 0.8rem;">닦기</p>
            <div class="data-value">${data.cleaningDuty.mopping.join(', ')}</div>
        </div>
    `;

    const noticeContainer = document.getElementById('notice-list');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const topNotices = data.allNotices
        .filter(n => new Date(n.date) >= today)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 3);

    if (topNotices.length === 0) {
        noticeContainer.innerHTML = `<p style="color: #888; font-size: 0.9rem;">진행 중인 수행평가가 없습니다.</p>`;
    } else {
        noticeContainer.innerHTML = topNotices.map(notice => {
            const dCount = getDDayCount(notice.date);
            const dText = dCount === 0 ? "D-Day" : `D-${dCount}`;
            const isUrgent = dCount <= 3;

            return `
                <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(128,128,128,0.05); padding: 15px; border-radius: 16px;">
                    <span style="font-size: 0.95rem;">
                        <span style="color: #888; font-size: 0.8rem; margin-right: 5px;">[${notice.category}]</span>
                        ${notice.title}
                    </span>
                    <span style="color: ${isUrgent ? '#ff3b30' : '#888'}; font-family: 'JetBrains Mono'; font-weight: 600;">
                        ${dText}
                    </span>
                </div>
            `;
        }).join('');
    }
}