document.addEventListener('DOMContentLoaded', () => {
    // 1. 서버에서 가져온 데이터 (전체 데이터라고 가정)
    const serverData = {
        user: {
            name: "홍길동",
            grade: 1,
            class: 5,
            number: 1,
            role: "일반 학생"
        },
        lateStudents: ["김철수", "이영희", "박지민"],
        cleaningDuty: {
            sweeping: ["06", "07"],
            mopping: ["04", "05"]
        },
        // [수정] 모든 수행평가 데이터 (게시판의 데이터 형식과 통일)
        allNotices: [
            { id: 1, title: "수학: 미분과 적분 단원평가", date: "2026-05-15", category: "수행" },
            { id: 2, title: "영어: 영미문학 에세이 제출", date: "2026-05-20", category: "과제" },
            { id: 3, title: "과학: 화학 반응 실험 보고서", date: "2025-12-25", category: "수행" }, // 가장 임박
            { id: 4, title: "국어: 현대시 분석 발표", date: "2026-01-10", category: "발표" },
            { id: 5, title: "체육: 배드민턴 실기 테스트", date: "2025-12-28", category: "수행" }
        ]
    };

    const userName = decodeURIComponent(getCookie('userName') || "사용자");
    const userRole = getCookie('userRole') || "N";
    const userNumber = getCookie('userNumber') || "0";
    
    // 역할을 한글로 변환
    const roleMap = { 'A': '관리자', 'T': '대시보드 관리', 'N': '학생', 'D': '데이터센터 관리', 'B': '게시판 관리' };

    // 2. HTML 엘리먼트에 직접 주입 (더미 데이터 대신 쿠키값 사용)
    const displayName = document.getElementById('display-name');
    const displayMeta = document.getElementById('display-meta');

    if (displayName) displayName.innerText = userName;
    if (displayMeta) {
        // 학년, 반은 고정값이거나 쿠키에 없다면 아래처럼 구성
        displayMeta.innerText = `1학년 5반 ${userNumber}번 · ${roleMap[userRole]}`;
    }

    renderDashboard(serverData);
});

// 쿠키 읽기용 함수 (필수)
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

// D-Day 계산 함수 (대시보드 전용)
function getDDayCount(targetDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    const diff = target - today;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// 2. 화면에 데이터를 그리는 함수
function renderDashboard(data) {
    // 프로필 및 지각생, 청소 당번 로직은 기존과 동일
    document.getElementById('display-name').innerText = data.user.name;
    document.getElementById('display-meta').innerText = 
        `${data.user.grade}학년 ${data.user.class}반 ${data.user.number}번 · ${data.user.role}`;

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

    // --- [수정된 공지사항 로직] ---
    const noticeContainer = document.getElementById('notice-list');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. 마감되지 않은(오늘 포함 미래) 데이터만 필터링 후 기한순 정렬
    const topNotices = data.allNotices
        .filter(n => new Date(n.date) >= today) // 마감된 건 제외
        .sort((a, b) => new Date(a.date) - new Date(b.date)) // 가까운 날짜순
        .slice(0, 3); // 상위 3개만 추출

    // 2. 렌더링
    if (topNotices.length === 0) {
        noticeContainer.innerHTML = `<p style="color: #888; font-size: 0.9rem;">진행 중인 수행평가가 없습니다.</p>`;
    } else {
        noticeContainer.innerHTML = topNotices.map(notice => {
            const dCount = getDDayCount(notice.date);
            const dText = dCount === 0 ? "D-Day" : `D-${dCount}`;
            const isUrgent = dCount <= 3; // 3일 이내면 강조

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