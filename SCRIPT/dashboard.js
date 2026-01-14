// [설정] 데이터 서버의 배포 주소를 입력하세요.
const DATA_SERVER_URL = "https://your-data-server.vercel.app"; 

document.addEventListener('DOMContentLoaded', () => {
    const roleMap = { 'A': '관리자', 'T': '대시보드 관리', 'N': '학생', 'D': '데이터센터 관리', 'B': '게시판 관리' };
    
    // 1. 유저 정보는 쿠키에서 먼저 가져옴
    const userData = {
        name: decodeURIComponent(getCookie('userName') || "알 수 없는 사용자"),
        grade: 1,
        class: 5,
        number: getCookie('userNumber') || "#",
        role: roleMap[getCookie('userRole') || "N"]
    };

    // 2. 초기 로딩 상태 표시 (데이터를 가져오기 전)
    renderDashboard({
        user: userData,
        lateStudents: ["로딩 중..."],
        cleaningDuty: { sweeping: ["??"], mopping: ["??"] },
        allNotices: []
    });

    // 3. 서버에서 실제 데이터를 불러옴
    fetchDashboardData(userData);
});

// [추가] 서버에서 데이터를 가져오는 비동기 함수
async function fetchDashboardData(userData) {
    try {
        const response = await fetch(`${DATA_SERVER_URL}/api/auth/import?target=dashboard`);
        if (!response.ok) throw new Error('서버 응답 오류');
        
        const data = await response.json();

        // 서버 데이터를 기존 dashboard.js 형식에 맞춰 가공
        const lateArray = data.latecomers ? data.latecomers.split(',').map(s => s.trim()) : [];
        const cleanValues = data.cleaning ? data.cleaning.split(',').map(s => s.trim()) : ["??", "??", "??", "??"];

        const serverData = {
            user: userData,
            lateStudents: lateArray,
            cleaningDuty: {
                sweeping: [cleanValues[0] || "??", cleanValues[1] || "??"],
                mopping: [cleanValues[2] || "??", cleanValues[3] || "??"]
            },
            allNotices: data.allNotices || []
        };

        renderDashboard(serverData);

    } catch (error) {
        console.error("데이터 로딩 실패:", error);
        // [요청사항] 실패 시 지각생은 오류 메시지, 당번은 ?? 표시
        renderDashboard({
            user: userData,
            lateStudents: ["오류:로딩 실패"],
            cleaningDuty: { sweeping: ["??"], mopping: ["??"] },
            allNotices: []
        });
    }
}

// 쿠키 읽기용 함수
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

// D-Day 계산 함수
function getDDayCount(targetDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    const diff = target - today;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// 화면에 데이터를 그리는 함수 (기존 로직 유지)
function renderDashboard(data) {
    document.getElementById('display-name').innerText = data.user.name;
    document.getElementById('display-meta').innerText = 
        `${data.user.grade}학년 ${data.user.class}반 ${data.user.number}번 · ${data.user.role}`;

    const lateListContainer = document.getElementById('late-list');
    if (lateListContainer) {
        lateListContainer.innerHTML = data.lateStudents.map(name => 
            `<span class="dot-badge">${name}</span>`
        ).join('');
    }

    const cleaningContainer = document.getElementById('duty-container');
    if (cleaningContainer) {
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
    }

    const noticeContainer = document.getElementById('notice-list');
    if (noticeContainer) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 기한이 남은 상위 3개 추출 로직 (기존 유지)
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
                        <span style="color: ${isUrgent ? 'var(--accent-red)' : '#888'}; font-family: 'JetBrains Mono'; font-weight: 600;">
                            ${dText}
                        </span>
                    </div>
                `;
            }).join('');
        }
    }
}