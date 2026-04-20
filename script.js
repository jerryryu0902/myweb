/**
 * 류재정 로봇 자동화 포트폴리오 - Firebase Realtime Database 게시판 버전
 */

const FIREBASE_DB_URL = "https://myweb-6bc43-default-rtdb.firebaseio.com";
let currentPostId = null;

/* --------------------------------
 * 공통 초기화
 * -------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
    initRevealAnimation();
    initAntiGravityControl();
    loadPosts();
});

/**
 * 1. 스크롤 애니메이션
 */
function initRevealAnimation() {
    const revealElements = document.querySelectorAll('.reveal');
    if (!revealElements.length) return;

    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    };

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, observerOptions);

    revealElements.forEach(el => revealObserver.observe(el));
}

/**
 * 2. 마우스 상호작용 부유 효과
 */
function initAntiGravityControl() {
    const floatTarget = document.querySelector('.anti-gravity-wrapper');
    if (floatTarget) {
        floatTarget.addEventListener('mouseenter', () => {
            floatTarget.style.animationDuration = '2s';
        });
        floatTarget.addEventListener('mouseleave', () => {
            floatTarget.style.animationDuration = '6s';
        });
    }
}

/* --------------------------------
 * 게시판 기능
 * -------------------------------- */

// 글쓰기 폼 토글
function toggleForm() {
    const form = document.getElementById('write-form');
    if (!form) return;

    const currentDisplay = window.getComputedStyle(form).display;
    const willOpen = currentDisplay === 'none';

    form.style.display = willOpen ? 'block' : 'none';

    if (willOpen) {
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// 게시글 목록 불러오기
async function loadPosts() {
    const boardList = document.getElementById('board-list');
    if (!boardList) return;

    boardList.innerHTML = `
        <tr>
            <td colspan="5" style="text-align:center; padding:20px;">데이터를 불러오는 중입니다...</td>
        </tr>
    `;

    try {
        const response = await fetch(`${FIREBASE_DB_URL}/posts.json`);
        if (!response.ok) {
            throw new Error(`목록 조회 실패 (${response.status})`);
        }

        const data = await response.json();

        if (!data) {
            boardList.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center; padding:20px;">등록된 게시글이 없습니다.</td>
                </tr>
            `;
            return;
        }

        const posts = Object.entries(data).map(([id, post]) => ({
            id,
            ...post
        }));

        posts.sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));

        boardList.innerHTML = '';

        posts.forEach((post, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${posts.length - index}</td>
                <td style="cursor:pointer; color:#3498db; font-weight:bold;" onclick="viewPost('${post.id}')">
                    ${escapeHtml(post.title || '')}
                </td>
                <td>${escapeHtml(post.author || '')}</td>
                <td>${formatDate(post.updatedAt || post.createdAt)}</td>
                <td>${post.likes || 0}</td>
            `;
            boardList.appendChild(row);
        });
    } catch (error) {
        console.error(error);
        boardList.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center; padding:20px; color:#d32f2f;">
                    게시글을 불러오지 못했습니다. Firebase 규칙 또는 DB 주소를 확인하세요.
                </td>
            </tr>
        `;
    }
}

// 게시글 등록
async function submitPost() {
    const titleEl = document.getElementById('title');
    const authorEl = document.getElementById('author');
    const contentEl = document.getElementById('content');
    const pwdEl = document.getElementById('pwd');

    if (!titleEl || !authorEl || !contentEl || !pwdEl) {
        alert('게시글 입력 폼을 찾을 수 없습니다.');
        return;
    }

    const title = titleEl.value.trim();
    const author = authorEl.value.trim();
    const content = contentEl.value.trim();
    const password = pwdEl.value.trim();

    if (!title || !author || !content || !password) {
        alert('제목, 작성자, 내용, 비밀번호를 모두 입력해 주세요.');
        return;
    }

    const newPost = {
        title,
        author,
        content,
        password,
        createdAt: Date.now(),
        likes: 0
    };

    try {
        const response = await fetch(`${FIREBASE_DB_URL}/posts.json`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newPost)
        });

        if (!response.ok) {
            throw new Error(`게시글 등록 실패 (${response.status})`);
        }

        titleEl.value = '';
        authorEl.value = '';
        contentEl.value = '';
        pwdEl.value = '';

        alert('게시글이 등록되었습니다.');
        toggleForm();
        await loadPosts();
    } catch (error) {
        console.error(error);
        alert('게시글 등록에 실패했습니다. Firebase 규칙을 확인하세요.');
    }
}

// 게시글 상세 보기
async function viewPost(postId) {
    try {
        const response = await fetch(`${FIREBASE_DB_URL}/posts/${postId}.json`);
        if (!response.ok) {
            throw new Error(`게시글 조회 실패 (${response.status})`);
        }

        const post = await response.json();

        if (!post) {
            alert('게시글이 존재하지 않습니다.');
            return;
        }

        currentPostId = postId;

        const detailBox = document.getElementById('post-detail');
        const titleBox = document.getElementById('detail-title');
        const metaBox = document.getElementById('detail-meta');
        const contentBox = document.getElementById('detail-content');

        titleBox.textContent = post.title || '(제목 없음)';

        const createdText = `작성일: ${formatDate(post.createdAt)}`;
        const updatedText = post.updatedAt ? ` | 수정일: ${formatDate(post.updatedAt)}` : '';
        metaBox.textContent = `작성자: ${post.author || '-'} | ${createdText}${updatedText} | 좋아요: ${post.likes || 0}`;

        contentBox.textContent = post.content || '';

        detailBox.style.display = 'block';
        detailBox.scrollIntoView({ behavior: 'smooth', block: 'start' });

        await loadComments(postId);
    } catch (error) {
        console.error(error);
        alert('게시글을 불러오지 못했습니다.');
    }
}

// 상세 닫기
function closePostDetail() {
    const detailBox = document.getElementById('post-detail');
    if (detailBox) detailBox.style.display = 'none';
    currentPostId = null;
}

// 좋아요
async function likeCurrentPost() {
    if (!currentPostId) {
        alert('먼저 게시글을 선택해 주세요.');
        return;
    }

    try {
        const response = await fetch(`${FIREBASE_DB_URL}/posts/${currentPostId}.json`);
        if (!response.ok) {
            throw new Error(`게시글 조회 실패 (${response.status})`);
        }

        const post = await response.json();
        if (!post) {
            alert('게시글이 존재하지 않습니다.');
            return;
        }

        const newLikes = (post.likes || 0) + 1;

        const updateResponse = await fetch(`${FIREBASE_DB_URL}/posts/${currentPostId}.json`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ likes: newLikes })
        });

        if (!updateResponse.ok) {
            throw new Error(`좋아요 반영 실패 (${updateResponse.status})`);
        }

        await viewPost(currentPostId);
        await loadPosts();
    } catch (error) {
        console.error(error);
        alert('좋아요 처리에 실패했습니다.');
    }
}

/* --------------------------------
 * 수정 기능
 * -------------------------------- */
async function openEditModal() {
    if (!currentPostId) {
        alert('먼저 게시글을 선택해 주세요.');
        return;
    }

    try {
        const response = await fetch(`${FIREBASE_DB_URL}/posts/${currentPostId}.json`);
        if (!response.ok) {
            throw new Error(`게시글 조회 실패 (${response.status})`);
        }

        const post = await response.json();
        if (!post) {
            alert('게시글이 존재하지 않습니다.');
            return;
        }

        document.getElementById('edit-title').value = post.title || '';
        document.getElementById('edit-author').value = post.author || '';
        document.getElementById('edit-content').value = post.content || '';
        document.getElementById('edit-pwd').value = '';

        const modal = document.getElementById('edit-modal');
        modal.style.display = 'block';
        modal.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
        console.error(error);
        alert('수정창을 열지 못했습니다.');
    }
}

function closeEditModal() {
    const modal = document.getElementById('edit-modal');
    if (modal) modal.style.display = 'none';
}

async function saveEditedPost() {
    if (!currentPostId) {
        alert('먼저 게시글을 선택해 주세요.');
        return;
    }

    const title = document.getElementById('edit-title').value.trim();
    const author = document.getElementById('edit-author').value.trim();
    const content = document.getElementById('edit-content').value.trim();
    const inputPwd = document.getElementById('edit-pwd').value.trim();

    if (!title || !author || !content || !inputPwd) {
        alert('제목, 작성자, 내용, 비밀번호를 모두 입력해 주세요.');
        return;
    }

    try {
        const response = await fetch(`${FIREBASE_DB_URL}/posts/${currentPostId}.json`);
        if (!response.ok) {
            throw new Error(`게시글 조회 실패 (${response.status})`);
        }

        const post = await response.json();
        if (!post) {
            alert('게시글이 존재하지 않습니다.');
            return;
        }

        if (post.password !== inputPwd) {
            alert('비밀번호가 일치하지 않습니다.');
            return;
        }

        const updateResponse = await fetch(`${FIREBASE_DB_URL}/posts/${currentPostId}.json`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title,
                author,
                content,
                updatedAt: Date.now()
            })
        });

        if (!updateResponse.ok) {
            throw new Error(`게시글 수정 실패 (${updateResponse.status})`);
        }

        alert('게시글이 수정되었습니다.');
        closeEditModal();
        await viewPost(currentPostId);
        await loadPosts();
    } catch (error) {
        console.error(error);
        alert('게시글 수정에 실패했습니다.');
    }
}

// 삭제
async function promptDeletePost() {
    if (!currentPostId) {
        alert('먼저 게시글을 선택해 주세요.');
        return;
    }

    const inputPwd = prompt('삭제 비밀번호를 입력하세요.');
    if (!inputPwd) return;

    try {
        const response = await fetch(`${FIREBASE_DB_URL}/posts/${currentPostId}.json`);
        if (!response.ok) {
            throw new Error(`게시글 조회 실패 (${response.status})`);
        }

        const post = await response.json();
        if (!post) {
            alert('게시글이 존재하지 않습니다.');
            return;
        }

        if (post.password !== inputPwd) {
            alert('비밀번호가 일치하지 않습니다.');
            return;
        }

        const deletePostRes = await fetch(`${FIREBASE_DB_URL}/posts/${currentPostId}.json`, {
            method: 'DELETE'
        });

        if (!deletePostRes.ok) {
            throw new Error(`게시글 삭제 실패 (${deletePostRes.status})`);
        }

        await fetch(`${FIREBASE_DB_URL}/comments/${currentPostId}.json`, {
            method: 'DELETE'
        });

        alert('게시글이 삭제되었습니다.');
        closeEditModal();
        closePostDetail();
        await loadPosts();
    } catch (error) {
        console.error(error);
        alert('게시글 삭제에 실패했습니다.');
    }
}

/* --------------------------------
 * 댓글 기능
 * -------------------------------- */
async function loadComments(postId) {
    const commentList = document.getElementById('comment-list');
    if (!commentList) return;

    commentList.innerHTML = '댓글을 불러오는 중입니다...';

    try {
        const response = await fetch(`${FIREBASE_DB_URL}/comments/${postId}.json`);
        if (!response.ok) {
            throw new Error(`댓글 조회 실패 (${response.status})`);
        }

        const data = await response.json();

        if (!data) {
            commentList.innerHTML = '<p style="color:#666;">아직 댓글이 없습니다.</p>';
            return;
        }

        const comments = Object.entries(data).map(([id, comment]) => ({
            id,
            ...comment
        }));

        comments.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

        commentList.innerHTML = comments.map(comment => `
            <div style="padding:1rem; border:1px solid #e5e7eb; border-radius:12px; margin-bottom:0.75rem; background:#fff;">
                <div style="font-weight:700; margin-bottom:0.35rem;">${escapeHtml(comment.author || '익명')}</div>
                <div style="white-space:pre-wrap; margin-bottom:0.5rem;">${escapeHtml(comment.content || '')}</div>
                <div style="font-size:0.9rem; color:#777;">${formatDate(comment.createdAt)}</div>
            </div>
        `).join('');
    } catch (error) {
        console.error(error);
        commentList.innerHTML = '<p style="color:#d32f2f;">댓글을 불러오지 못했습니다.</p>';
    }
}

async function submitComment() {
    if (!currentPostId) {
        alert('먼저 게시글을 선택해 주세요.');
        return;
    }

    const authorEl = document.getElementById('comment-author');
    const contentEl = document.getElementById('comment-content');

    if (!authorEl || !contentEl) return;

    const author = authorEl.value.trim();
    const content = contentEl.value.trim();

    if (!author || !content) {
        alert('댓글 작성자와 내용을 입력해 주세요.');
        return;
    }

    const newComment = {
        author,
        content,
        createdAt: Date.now()
    };

    try {
        const response = await fetch(`${FIREBASE_DB_URL}/comments/${currentPostId}.json`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newComment)
        });

        if (!response.ok) {
            throw new Error(`댓글 등록 실패 (${response.status})`);
        }

        authorEl.value = '';
        contentEl.value = '';

        await loadComments(currentPostId);
    } catch (error) {
        console.error(error);
        alert('댓글 등록에 실패했습니다.');
    }
}

/* --------------------------------
 * 유틸
 * -------------------------------- */
function formatDate(timestamp) {
    if (!timestamp) return '-';

    const date = new Date(timestamp);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');

    return `${y}-${m}-${d}`;
}

function escapeHtml(str) {
    return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}