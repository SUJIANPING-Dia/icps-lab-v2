interface SearchItem { id: string; year: string; title: string; detail: string }
interface SearchGroup { slug: string; enLabel: string; zhLabel: string; items: SearchItem[] }
interface SearchRecord extends SearchItem { label: string; href: string; terms: string }

export function indexRecords(groups: SearchGroup[], english: boolean): SearchRecord[] {
  return groups.flatMap(group => group.items.map(item => ({
    ...item,
    label: english ? group.enLabel : group.zhLabel,
    href: (english ? '/en' : '') + '/achievements' + (group.slug ? '/' + group.slug : '') + '#' + item.id,
    terms: [group.zhLabel, group.enLabel, item.year, item.title, item.detail].join(' ').toLowerCase(),
  })));
}

export function initAchievementSearch() {
  const input = document.querySelector<HTMLInputElement>('#search-input')!;
  const clear = document.querySelector<HTMLButtonElement>('#clear-search')!;
  const results = document.getElementById('search-results')!;
  const browse = document.getElementById('category-records')!;
  const status = document.getElementById('search-status')!;
  const list = document.getElementById('result-list')!;
  const pagination = document.getElementById('search-pagination')!;
  const previous = document.querySelector<HTMLButtonElement>('#search-prev')!;
  const next = document.querySelector<HTMLButtonElement>('#search-next')!;
  const pageIndicator = document.getElementById('search-page')!;
  const english = document.documentElement.lang === 'en';
  const pageSize = 25;
  let index: Promise<SearchRecord[]> | undefined;
  let matches: SearchRecord[] = [];
  let page = 0;
  let revision = 0;

  function loadIndex() {
    index ??= fetch('/achievements/search-index.json').then(async response => {
      if (!response.ok) throw new Error('Search index unavailable');
      return indexRecords(await response.json(), english);
    }).catch(error => { index = undefined; throw error; });
    return index;
  }

  function renderResults() {
    const fragment = document.createDocumentFragment();
    for (const record of matches.slice(page * pageSize, (page + 1) * pageSize)) {
      const item = document.createElement('li');
      item.className = 'rounded-2xl border border-slate-200 bg-white p-5';
      const link = document.createElement('a');
      link.href = record.href;
      link.className = 'font-bold text-blue-800 hover:underline';
      link.textContent = record.title;
      const meta = document.createElement('p');
      meta.className = 'mt-1 text-sm text-slate-600';
      meta.textContent = [record.label, record.year, record.detail].filter(Boolean).join(' · ');
      item.append(link, meta);
      fragment.append(item);
    }
    list.replaceChildren(fragment);
    const pages = Math.ceil(matches.length / pageSize);
    pageIndicator.textContent = (page + 1) + ' / ' + pages;
    previous.disabled = page === 0;
    next.disabled = page + 1 >= pages;
    pagination.hidden = pages <= 1;
    status.textContent = matches.length
      ? matches.length + (english ? ' matching records' : ' 筆符合的紀錄')
      : (english ? 'No matching records' : '找不到相關紀錄');
    status.dataset.count = String(matches.length);
  }

  async function search() {
    const version = ++revision;
    const term = input.value.trim().toLowerCase();
    clear.hidden = !term;
    results.hidden = !term;
    browse.hidden = Boolean(term);
    if (!term) return;
    try {
      if (!index) status.textContent = english ? 'Loading search…' : '正在載入搜尋資料…';
      const records = await loadIndex();
      if (version !== revision) return;
      matches = records.filter(record => record.terms.includes(term));
      page = 0;
      renderResults();
    } catch {
      if (version !== revision) return;
      list.replaceChildren();
      pagination.hidden = true;
      delete status.dataset.count;
      status.textContent = english ? 'Search is unavailable. Browse by category or try again.' : '暫時無法搜尋，請使用分類瀏覽或稍後重試。';
    }
  }
  function reset() { input.value = ''; void search(); }
  function revealRecord() {
    const target = document.getElementById(location.hash.slice(1));
    if (!target?.matches('.achievement-item, #content-area')) return;
    reset();
    const year = target.closest('details');
    if (year) year.open = true;
    target.scrollIntoView();
  }

  input.addEventListener('input', search);
  clear.addEventListener('click', () => { reset(); input.focus(); });
  previous.addEventListener('click', () => { if (page > 0) { page--; renderResults(); } });
  next.addEventListener('click', () => { if ((page + 1) * pageSize < matches.length) { page++; renderResults(); } });
  // Same-page links can be followed more than once without a hashchange event.
  document.getElementById('main-content')!.addEventListener('click', event => {
    const link = event.target instanceof Element && event.target.closest('a');
    if (link && link.origin === location.origin && link.hash && link.pathname === location.pathname &&
      !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
      reset();
      const year = document.getElementById(link.hash.slice(1))?.closest('details');
      if (year) year.open = true;
    }
  });
  window.addEventListener('hashchange', revealRecord);
  document.getElementById('achievement-search')!.hidden = false;
  if (location.hash) revealRecord();
  if (input.value) void search();
}
