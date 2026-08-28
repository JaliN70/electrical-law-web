(function () {
  'use strict';

  const app = document.getElementById('app');
  const backBtn = document.getElementById('backBtn');
  const pageTitle = document.getElementById('pageTitle');
  const pageSub = document.getElementById('pageSub');
  const headerMojLink = document.getElementById('headerMojLink');
  const toast = document.getElementById('toast');

  document.getElementById('sysDate').textContent = LAW.updated;
  document.getElementById('sysAuthor').textContent = LAW.author;
  document.getElementById('lawDate').textContent = LAW.amended;

  let toastTimer;

  const CHAPTER_LABELS = [
    '第一章', '第二章', '第三章', '第四章', '第五章',
    '第六章', '第七章', '第八章', '第九章', '第十章',
  ];

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  function formatArticleNum(art) {
    return art.includes('-') ? art : art;
  }

  function articleDisplayTitle(art) {
    return `第 ${art} 條`;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /** 由 CATEGORIES 組出章節大項（依出現順序） */
  function getChapters() {
    const chapters = [];
    const map = new Map();

    CATEGORIES.forEach((cat) => {
      const chapterId = cat.id.split('-')[0];
      if (!map.has(chapterId)) {
        const chapter = {
          id: chapterId,
          title: cat.subtitle,
          icon: cat.icon,
          sections: [],
        };
        map.set(chapterId, chapter);
        chapters.push(chapter);
      }
      map.get(chapterId).sections.push(cat);
    });

    chapters.forEach((ch, i) => {
      ch.label = CHAPTER_LABELS[i] || `第 ${i + 1} 章`;
      ch.articleCount = ch.sections.reduce((n, s) => n + s.articles.length, 0);
    });

    return chapters;
  }

  const CHAPTERS = getChapters();

  function parseHash() {
    const raw = location.hash.replace(/^#\/?/, '');
    if (!raw) return [];
    return raw.split('/').map((p) => decodeURIComponent(p)).filter(Boolean);
  }

  function buildHash(parts) {
    if (!parts.length) return '#/';
    return '#/' + parts.map((p) => encodeURIComponent(p)).join('/');
  }

  function navigate(parts) {
    const hash = buildHash(parts);
    if (location.hash !== hash) {
      location.hash = hash;
    } else {
      route();
    }
  }

  function renderHome() {
    backBtn.hidden = true;
    pageTitle.textContent = '電氣設備法規';
    pageSub.textContent = LAW.name;
    headerMojLink.href = LAW.fullUrl;

    const totalArts = CATEGORIES.reduce((n, c) => n + c.articles.length, 0);

    const cards = CHAPTERS.map((ch, i) => `
      <li class="fade-up" style="animation-delay:${i * 0.04}s">
        <button type="button" class="cat-card cat-card--chapter" data-chapter="${escapeHtml(ch.id)}" aria-label="${escapeHtml(ch.label + ' ' + ch.title)}">
          <span class="cat-icon" aria-hidden="true">${ch.icon}</span>
          <h2 class="cat-title">${escapeHtml(ch.label)}</h2>
          <p class="cat-sub">${escapeHtml(ch.title)}</p>
          <span class="cat-count">${ch.sections.length} 節 · ${ch.articleCount} 條</span>
        </button>
      </li>
    `).join('');

    app.innerHTML = `
      <section class="hero fade-up">
        <span class="hero-eyebrow">Electrical Installation Code</span>
        <h2 class="hero-title">${escapeHtml(LAW.name)}</h2>
        <p class="hero-desc">共 ${CHAPTERS.length} 章 · ${CATEGORIES.length} 節 · ${totalArts} 條，點選章節進入查詢</p>
        <a class="hero-cta" href="${LAW.fullUrl}" target="_blank" rel="noopener">
          完整法規
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        </a>
      </section>
      <p class="section-label">章節目錄</p>
      <ul class="cat-grid cat-grid--chapters">${cards}</ul>
    `;
  }

  function renderChapter(chapterId) {
    const chapter = CHAPTERS.find((c) => c.id === chapterId);
    if (!chapter) {
      navigate([]);
      return;
    }

    backBtn.hidden = false;
    pageTitle.textContent = chapter.title;
    pageSub.textContent = chapter.label;
    headerMojLink.href = LAW.fullUrl;

    const cards = chapter.sections.map((sec, i) => `
      <li class="fade-up" style="animation-delay:${i * 0.03}s">
        <button type="button" class="cat-card" data-section="${escapeHtml(sec.id)}" aria-label="${escapeHtml(sec.title)}">
          <span class="cat-icon" aria-hidden="true">${sec.icon}</span>
          <h2 class="cat-title">${escapeHtml(sec.title)}</h2>
          <p class="cat-sub">${escapeHtml(chapter.title)}</p>
          <span class="cat-count">${sec.articles.length} 項法條</span>
        </button>
      </li>
    `).join('');

    app.innerHTML = `
      <header class="cat-header fade-up">
        <div class="cat-header-icon" aria-hidden="true">${chapter.icon}</div>
        <h2 class="cat-header-title">${escapeHtml(chapter.label)} ${escapeHtml(chapter.title)}</h2>
        <p class="cat-header-sub">${chapter.sections.length} 節 · ${chapter.articleCount} 條</p>
        <p class="cat-header-desc">選擇節次以查看法條連結</p>
      </header>
      <p class="section-label">各節內容</p>
      <ul class="cat-grid">${cards}</ul>
    `;
  }

  function renderSection(sectionId) {
    const cat = CATEGORIES.find((c) => c.id === sectionId);
    if (!cat) {
      navigate([]);
      return;
    }

    backBtn.hidden = false;
    pageTitle.textContent = cat.title;
    pageSub.textContent = cat.subtitle;
    headerMojLink.href = LAW.fullUrl;

    const articlesHtml = cat.articles
      .map(
        (item, i) => `
        <li class="fade-up" style="animation-delay:${Math.min(i, 12) * 0.02}s">
          <a class="art-btn" href="${mojArticleUrl(item.art)}" target="_blank" rel="noopener"
             data-art="${escapeHtml(item.art)}">
            <span class="art-num">${escapeHtml(formatArticleNum(item.art))}</span>
            <span class="art-label">${escapeHtml(item.label)}</span>
            <svg class="art-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>
        </li>
      `
      )
      .join('');

    app.innerHTML = `
      <header class="cat-header fade-up">
        <div class="cat-header-icon" aria-hidden="true">${cat.icon}</div>
        <h2 class="cat-header-title">${escapeHtml(cat.title)}</h2>
        <p class="cat-header-sub">${escapeHtml(cat.subtitle)}</p>
        <p class="cat-header-desc">${escapeHtml(cat.desc)}</p>
      </header>
      <p class="section-label">法條連結 · 全國法規資料庫</p>
      <ul class="art-list">${articlesHtml}</ul>
    `;
  }

  function route() {
    const parts = parseHash();

    if (parts.length === 0) {
      renderHome();
      return;
    }

    if (parts.length === 1) {
      renderChapter(parts[0]);
      return;
    }

    renderSection(parts[1]);
  }

  function goBack() {
    const parts = parseHash();
    if (parts.length >= 2) {
      navigate([parts[0]]);
    } else {
      navigate([]);
    }
  }

  app.addEventListener('click', (e) => {
    const chapterBtn = e.target.closest('[data-chapter]');
    if (chapterBtn) {
      e.preventDefault();
      navigate([chapterBtn.dataset.chapter]);
      return;
    }

    const sectionBtn = e.target.closest('[data-section]');
    if (sectionBtn) {
      e.preventDefault();
      const chapterId = sectionBtn.dataset.section.split('-')[0];
      navigate([chapterId, sectionBtn.dataset.section]);
      return;
    }

    const artLink = e.target.closest('.art-btn');
    if (artLink) {
      showToast(`開啟 ${articleDisplayTitle(artLink.dataset.art)}`);
    }
  });

  backBtn.addEventListener('click', goBack);
  window.addEventListener('hashchange', route);

  route();
})();
