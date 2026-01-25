// [설정] 데이터 서버의 배포 주소
const DATA_SERVER_URL = "https://classos7-dx.vercel.app";

document.addEventListener('DOMContentLoaded', () => {
    const roleMap = { 
        'A': '관리자', 
        'T': '대시보드 관리', 
        'N': '학생', 
        'D': '데이터센터 관리', 
        'B': '게시판 관리' 
    };

    // 1. 유저 정보 구성 (쿠키 기반)
    const userData = {
        name: decodeURIComponent(getCookie('userName') || "알 수 없는 사용자"),
        grade: 1,
        class: 5,
        number: getCookie('userNumber') || "#",
        role: roleMap[getCookie('userRole') || "N"]
    };

    // 2. 1분(60초) 타임아웃 설정
    const loadTimeout = setTimeout(() => {
        const overlay = document.getElementById('loading-overlay');
        const text = document.getElementById('loading-text');
        if (overlay && overlay.style.display !== 'none') {
            overlay.classList.add('loading-failed');
            text.innerText = "데이터 로딩 실패 : 서버 대기 시간 1분을 초과하였습니다. 인터넷 연결을 확인하세요.";
            
            // 실패 메시지 표시 후 3초 뒤 강제 해제
            setTimeout(() => {
                overlay.style.opacity = '0';
                setTimeout(() => overlay.style.display = 'none', 500);
            }, 3000);
        }
    }, 60000);

    // 3. 초기 UI 렌더링 (로딩 상태 데이터)
    renderDashboard({
        user: userData,
        lateStudents: ["로딩 중..."],
        cleaningDuty: { sweeping: ["??"], mopping: ["??"] },
        allNotices: []
    });

    // 4. 서버 데이터 호출 시작
    fetchDashboardData(userData, loadTimeout);
});

/**
 * 서버에서 대시보드 데이터를 가져오는 비동기 함수
 */
async function fetchDashboardData(userData, loadTimeout) {
    const overlay = document.getElementById('loading-overlay');
    const text = document.getElementById('loading-text');

    try {
        const response = await fetch(`${DATA_SERVER_URL}/api/auth/import?target=dashboard`);
        if (!response.ok) throw new Error('서버 응답 오류');

        const data = await response.json();

        // 데이터 수신 성공 시 타임아웃 취소
        clearTimeout(loadTimeout);

        // 청소 당번 데이터 가공 (숫자만 추출하여 2자리 포맷팅)
        const rawCleaning = data.cleaning || "";
        const allNumbers = rawCleaning.match(/\d+/g) || [];
        const cleanNumbers = allNumbers.map(n => n.length === 1 ? n.padStart(2, '0') : n);

        const serverData = {
            user: userData,
            lateStudents: data.latecomers ? data.latecomers.split(',').map(s => s.trim()) : [],
            cleaningDuty: {
                sweeping: [cleanNumbers[0] || "??", cleanNumbers[1] || "??"],
                mopping: [cleanNumbers[2] || "??", cleanNumbers[3] || "??"]
            },
            allNotices: data.allNotices || []
        };

        // 데이터 렌더링
        renderDashboard(serverData);

        // 로딩 오버레이 부드럽게 제거
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.style.display = 'none', 500);
        }

    } catch (error) {
        // 에러 발생 시 타임아웃 취소 및 안내
        clearTimeout(loadTimeout);
        console.error("데이터 로딩 실패:", error);
        
        if (overlay) {
            overlay.classList.add('loading-failed');
            if (text) text.innerText = "서버 연결 실패 : 오류이거나 데이터 서버가 점검 중일 수도 있습니다.";
            
            setTimeout(() => {
                overlay.style.opacity = '0';
                setTimeout(() => overlay.style.display = 'none', 500);
            }, 3000);
        }

        renderDashboard({
            user: userData,
            lateStudents: ["로드 실패"],
            cleaningDuty: { sweeping: ["??"], mopping: ["??"] },
            allNotices: []
        });
    }
}

/**
 * 쿠키 가져오기 유틸리티
 */
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

/**
 * D-Day 계산 함수
 */
function getDDayCount(targetDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    const diff = target - today;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * 최종 UI 렌더링 함수
 */
function renderDashboard(data) {
    // 프로필 정보 업데이트
    document.getElementById('display-name').innerText = data.user.name;
    document.getElementById('display-meta').innerText =
        `${data.user.grade}학년 ${data.user.class}반 ${data.user.number}번 · ${data.user.role}`;

    // 지각생 목록 업데이트
    const lateListContainer = document.getElementById('late-list');
    if (lateListContainer) {
        lateListContainer.innerHTML = data.lateStudents.map(name =>
            `<span class="dot-badge">${name}</span>`
        ).join('');
    }

    // 청소 당번 업데이트
    const cleaningContainer = document.getElementById('duty-container');
    if (cleaningContainer) {
        cleaningContainer.innerHTML = `
            <div style="border-left: 1px solid var(--border-color); padding-left: 20px;">
                <p style="color: #666; font-size: 0.8rem;">쓸기</p>
                <div class="data-value">${data.cleaningDuty.sweeping.join(' | ')}</div>
            </div>
            <div style="border-left: 1px solid var(--border-color); padding-left: 20px;">
                <p style="color: #666; font-size: 0.8rem;">닦기</p>
                <div class="data-value">${data.cleaningDuty.mopping.join(' | ')}</div>
            </div>
        `;
    }

    // 수행평가 공지사항 업데이트
    const noticeContainer = document.getElementById('notice-list');
    if (noticeContainer) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 기한이 오늘 이후인 공지만 필터링하여 상위 3개 표시
        const topNotices = data.allNotices
            .filter(n => new Date(n.date) >= today)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 3);

        if (topNotices.length === 0) {
            noticeContainer.innerHTML = `<p style="color: #888; font-size: 0.9rem; padding: 10px;">진행 중인 수행평가가 없습니다.</p>`;
        } else {
            noticeContainer.innerHTML = topNotices.map(notice => {
                const dCount = getDDayCount(notice.date);
                const dText = dCount === 0 ? "D-Day" : `D-${dCount}`;
                const isUrgent = dCount <= 3;

                return `
                    <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(128,128,128,0.05); padding: 15px; border-radius: 16px; margin-bottom: 8px;">
                        <span style="font-size: 0.95rem;">
                            <span style="color: #888; font-size: 0.8rem; margin-right: 5px;">[${notice.category}]</span>
                            ${notice.title}
                        </span>
                        <span style="color: ${isUrgent ? 'var(--accent-red, #ff4d4d)' : '#888'}; font-family: 'JetBrains Mono'; font-weight: 600;">
                            ${dText}
                        </span>
                    </div>
                `;
            }).join('');
        }
    }
}