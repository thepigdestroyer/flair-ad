/* ============================================================
   FLAIR-AD · community.js
   Firebase Firestore — survey form + public forum
   ============================================================ */

(function () {
  'use strict';

  /* ── Firebase init ── */
  const cfg = {
    apiKey:            'AIzaSyB8hw0iTrgyMVR3rweVsIQ2EjjongsbyDM',
    authDomain:        'aruk-phd-project-flair-ad.firebaseapp.com',
    projectId:         'aruk-phd-project-flair-ad',
    storageBucket:     'aruk-phd-project-flair-ad.firebasestorage.app',
    messagingSenderId: '159637714726',
    appId:             '1:159637714726:web:6e76c18e2e220c604cf3e7',
  };

  let db;
  try {
    if (!firebase.apps.length) firebase.initializeApp(cfg);
    db = firebase.firestore();
  } catch (e) {
    console.warn('[FLAIR-AD] Firebase unavailable:', e);
  }

  const POSTS_COL    = 'forum_posts';
  const FEEDBACK_COL = 'feedback';
  const VOTED_KEY    = 'flair_voted';

  /* ── Utilities ── */
  function getVoted() {
    try { return JSON.parse(localStorage.getItem(VOTED_KEY) || '{}'); } catch { return {}; }
  }
  function setVoted(obj) {
    try { localStorage.setItem(VOTED_KEY, JSON.stringify(obj)); } catch (_) {}
  }
  function hasVoted(id) { return !!getVoted()[id]; }
  function markVoted(id) { const v = getVoted(); v[id] = true; setVoted(v); }

  function timeAgo(ts) {
    if (!ts) return '';
    const s = Math.floor((Date.now() - ts.toDate().getTime()) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return Math.floor(s / 60) + 'm ago';
    if (s < 86400) return Math.floor(s / 3600) + 'h ago';
    return Math.floor(s / 86400) + 'd ago';
  }

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ── Survey form ── */
  function buildSurveyHTML() {
    return `
<form id="share-form-inner" class="share-form-inner" novalidate>
  <div class="share-field">
    <label class="share-label" for="reflective-answer">
      What do you think is the biggest open question in this proposal?
    </label>
    <textarea id="reflective-answer" name="reflective-answer" rows="3"
      placeholder="e.g. The role of TREM2 in APOE-ε4 carriers…" maxlength="500"></textarea>
  </div>

  <div class="share-field">
    <label class="share-label">How easy was the site to navigate?</label>
    <div class="share-radios">
      <label><input type="radio" name="q_nav" value="easy" /> Easy</label>
      <label><input type="radio" name="q_nav" value="moderate" /> Moderate</label>
      <label><input type="radio" name="q_nav" value="challenging" /> Challenging</label>
    </div>
  </div>

  <div class="share-field">
    <label class="share-label">How clearly was the science explained?</label>
    <div class="share-radios">
      <label><input type="radio" name="q_clarity" value="very_clear" /> Very clear</label>
      <label><input type="radio" name="q_clarity" value="mostly_clear" /> Mostly clear</label>
      <label><input type="radio" name="q_clarity" value="needs_work" /> Needs work</label>
    </div>
  </div>

  <div class="share-field">
    <label class="share-label" for="q_recommend">
      How likely are you to recommend this to a colleague?
      <span id="q_recommend_val" class="share-range-val">5</span>/10
    </label>
    <input type="range" id="q_recommend" name="q_recommend" min="1" max="10" value="5" />
  </div>

  <div class="share-field">
    <label class="share-label">Which section was most compelling?</label>
    <div class="share-radios">
      <label><input type="radio" name="q_section" value="gwas" /> GWAS evidence</label>
      <label><input type="radio" name="q_section" value="snrnaseq" /> snRNA-seq</label>
      <label><input type="radio" name="q_section" value="ewce" /> EWCE specificity</label>
      <label><input type="radio" name="q_section" value="aims" /> Research aims</label>
    </div>
  </div>

  <div class="share-field">
    <label class="share-label" for="final-comments">Any other comments?</label>
    <textarea id="final-comments" name="final-comments" rows="2"
      placeholder="Optional…" maxlength="500"></textarea>
  </div>

  <button type="submit" class="btn btn--primary" id="share-submit">
    Submit anonymously
  </button>
</form>
<div id="share-thankyou" hidden style="text-align:center;padding:var(--s-8) 0">
  <p style="font-size:var(--fs-6);font-weight:600;color:var(--c-ink)">Thank you.</p>
  <p style="color:var(--c-ink-2);margin-top:var(--s-2)">Your feedback has been recorded anonymously.</p>
</div>`;
  }

  function initSurvey() {
    const wrap = document.getElementById('share-form');
    if (!wrap) return;
    wrap.innerHTML = buildSurveyHTML();

    const form    = document.getElementById('share-form-inner');
    const thanks  = document.getElementById('share-thankyou');
    const submitBtn = document.getElementById('share-submit');
    const rangeEl = document.getElementById('q_recommend');
    const rangeVal = document.getElementById('q_recommend_val');

    if (rangeEl && rangeVal) {
      rangeEl.addEventListener('input', () => { rangeVal.textContent = rangeEl.value; });
    }

    if (!form || !db) return;

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting…';

      function radio(name) {
        const el = form.querySelector(`input[name="${name}"]:checked`);
        return el ? el.value : null;
      }

      const payload = {
        reflective_answer: (form.querySelector('#reflective-answer')?.value || '').trim(),
        q_nav:             radio('q_nav'),
        q_clarity:         radio('q_clarity'),
        q_recommend:       form.querySelector('#q_recommend')?.value || null,
        q_section:         radio('q_section'),
        final_comments:    (form.querySelector('#final-comments')?.value || '').trim(),
        timestamp:         firebase.firestore.FieldValue.serverTimestamp(),
      };

      try {
        await db.collection(FEEDBACK_COL).add(payload);
        form.hidden   = true;
        thanks.hidden = false;
      } catch (err) {
        console.error('[FLAIR-AD] Survey error:', err);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Error — please try again';
      }
    });
  }

  /* ── Forum ── */
  function buildForumHTML() {
    return `
<div class="forum-controls">
  <div class="forum-post-composer">
    <label for="forum-name" class="sr-only">Your name (optional)</label>
    <input id="forum-name" type="text" placeholder="Your name (optional)"
      maxlength="40" class="forum-input" autocomplete="name" />
    <label for="forum-comment" class="sr-only">Share a thought, question, or critique</label>
    <textarea id="forum-comment" rows="3" maxlength="500"
      placeholder="Share a thought, question, or critique…" class="forum-input"></textarea>
    <div class="forum-composer-foot">
      <span class="forum-char-count"><span id="forum-char-num">0</span>/500</span>
      <button id="forum-submit" class="btn btn--primary">Post</button>
    </div>
  </div>
  <div class="forum-sort">
    <span class="forum-count-label" id="forum-count">Loading…</span>
    <div class="forum-sort-btns">
      <button class="sort-btn sort-btn--active" data-sort="recent">Recent</button>
      <button class="sort-btn" data-sort="top">Top</button>
    </div>
  </div>
</div>
<div id="forum-feed" class="forum-feed" aria-live="polite"></div>`;
  }

  let allPosts  = [];
  let sortMode  = 'recent';
  let unsubscribe = null;

  function renderPosts() {
    const feed    = document.getElementById('forum-feed');
    const countEl = document.getElementById('forum-count');
    if (!feed) return;

    const posts = allPosts.slice().sort((a, b) => {
      if (sortMode === 'top') return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
      const at = a.timestamp ? a.timestamp.toMillis() : 0;
      const bt = b.timestamp ? b.timestamp.toMillis() : 0;
      return bt - at;
    });

    if (countEl) {
      countEl.textContent = posts.length + ' community thought' + (posts.length !== 1 ? 's' : '');
    }

    if (!posts.length) {
      feed.innerHTML = '<p class="forum-empty">No posts yet — be the first to share a thought!</p>';
      return;
    }

    feed.innerHTML = posts.map(p => {
      const score  = (p.upvotes || 0) - (p.downvotes || 0);
      const voted  = hasVoted(p.id);
      const scoreHtml = score > 0
        ? `<span class="forum-score forum-score--pos">+${score}</span>`
        : score < 0
          ? `<span class="forum-score forum-score--neg">${score}</span>`
          : '';

      return `<article class="forum-post" data-id="${p.id}">
  <div class="forum-post-head">
    <span class="forum-post-name">${esc(p.name || 'Anonymous')}</span>
    <span class="forum-post-time">${timeAgo(p.timestamp)}</span>
  </div>
  <p class="forum-post-body">${esc(p.comment || '')}</p>
  <div class="forum-post-foot">
    <button class="vote-btn vote-btn--up${voted ? ' voted' : ''}"
      data-id="${p.id}" data-dir="up"${voted ? ' disabled' : ''}
      aria-label="Upvote">▲ <span>${p.upvotes || 0}</span></button>
    <button class="vote-btn vote-btn--down${voted ? ' voted' : ''}"
      data-id="${p.id}" data-dir="down"${voted ? ' disabled' : ''}
      aria-label="Downvote">▼ <span>${p.downvotes || 0}</span></button>
    ${scoreHtml}
  </div>
</article>`;
    }).join('');

    feed.querySelectorAll('.vote-btn:not([disabled])').forEach(btn => {
      btn.addEventListener('click', () => votePost(btn.dataset.id, btn.dataset.dir));
    });
  }

  async function votePost(postId, dir) {
    if (hasVoted(postId) || !db) return;
    markVoted(postId);
    allPosts = allPosts.map(p => {
      if (p.id !== postId) return p;
      const u = { ...p };
      if (dir === 'up')   u.upvotes   = (u.upvotes   || 0) + 1;
      if (dir === 'down') u.downvotes = (u.downvotes || 0) + 1;
      return u;
    });
    renderPosts();
    const field = dir === 'up' ? 'upvotes' : 'downvotes';
    try {
      await db.collection(POSTS_COL).doc(postId).update({
        [field]: firebase.firestore.FieldValue.increment(1),
      });
    } catch (err) { console.error('[FLAIR-AD] Vote error:', err); }
  }

  function loadForum() {
    if (!db) return;
    if (unsubscribe) unsubscribe();
    unsubscribe = db.collection(POSTS_COL)
      .orderBy('timestamp', 'desc').limit(200)
      .onSnapshot(
        snap => {
          allPosts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          renderPosts();
        },
        err => {
          console.error('[FLAIR-AD] Forum error:', err);
          const feed = document.getElementById('forum-feed');
          if (feed) feed.innerHTML = '<p class="forum-empty">Could not load posts — check your connection.</p>';
        }
      );
  }

  function initForum() {
    const wrap = document.getElementById('forum-wrap');
    if (!wrap) return;
    wrap.innerHTML = buildForumHTML();

    const submit  = document.getElementById('forum-submit');
    const nameEl  = document.getElementById('forum-name');
    const commentEl = document.getElementById('forum-comment');
    const charNum = document.getElementById('forum-char-num');

    if (commentEl && charNum) {
      commentEl.addEventListener('input', () => { charNum.textContent = commentEl.value.length; });
    }

    document.querySelectorAll('.sort-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('sort-btn--active'));
        btn.classList.add('sort-btn--active');
        sortMode = btn.dataset.sort;
        renderPosts();
      });
    });

    if (!submit || !db) return;

    submit.addEventListener('click', async () => {
      const name    = (nameEl?.value.trim() || '') || 'Anonymous';
      const comment = commentEl?.value.trim() || '';
      if (!comment) {
        commentEl?.focus();
        commentEl?.classList.add('input-error');
        setTimeout(() => commentEl?.classList.remove('input-error'), 1200);
        return;
      }

      submit.disabled    = true;
      submit.textContent = 'Posting…';

      try {
        await db.collection(POSTS_COL).add({
          name:      name.slice(0, 40),
          comment:   comment.slice(0, 500),
          upvotes:   0,
          downvotes: 0,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        });
        if (nameEl)    nameEl.value    = '';
        if (commentEl) { commentEl.value = ''; if (charNum) charNum.textContent = '0'; }
      } catch (err) {
        console.error('[FLAIR-AD] Post error:', err);
        submit.textContent = 'Error — retry';
        setTimeout(() => { submit.textContent = 'Post'; submit.disabled = false; }, 2500);
        return;
      }

      submit.textContent = 'Post';
      submit.disabled    = false;
    });

    loadForum();
  }

  document.addEventListener('DOMContentLoaded', () => {
    initSurvey();
    initForum();
  });
})();
