let all = [];
let filtered = [];
let activeChip = null;
let currentIndex = -1;

const el = (id) => document.getElementById(id);

const grid = el("grid");
const searchInput = el("searchInput");
const sortSelect = el("sortSelect");
const emptyState = el("emptyState");
const clearBtn = el("clearBtn");

const statTotal = el("statTotal");
const statShown = el("statShown");
const chipBox = el("chipBox");

// modal
const modal = el("modal");
const modalBackdrop = el("modalBackdrop");
const closeBtn = el("closeBtn");
const prevBtn = el("prevBtn");
const nextBtn = el("nextBtn");

const mTitle = el("mTitle");
const mMeta = el("mMeta");
const mImg = el("mImg");
const mDate = el("mDate");
const mName = el("mName");
const mId = el("mId");
const mTopic = el("mTopic");
const mSource = el("mSource");
const mExplanation = el("mExplanation");
const mTags = el("mTags");
const mFile = el("mFile");

function parseDate(d){
  // d: YYYY-MM-DD
  const [y,m,day] = d.split("-").map(Number);
  return new Date(y, m-1, day);
}
function formatDateCN(d){
  const dt = parseDate(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth()+1).padStart(2,"0");
  const day = String(dt.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}

function normalize(s){
  return (s ?? "")
    .toString()
    .toLowerCase()
    .replace(/\s+/g," ")
    .trim();
}

function buildChips(){
  // 用 tags 生成一些快捷筛选
  const tagCount = new Map();
  for(const c of all){
    for(const t of (c.tags ?? [])){
      tagCount.set(t, (tagCount.get(t)||0) + 1);
    }
  }
  // 取出现次数最多的前 12 个
  const top = [...tagCount.entries()]
    .sort((a,b)=> b[1]-a[1])
    .slice(0, 12)
    .map(([t])=> t);

  chipBox.innerHTML = "";
  const makeChip = (label) => {
    const div = document.createElement("div");
    div.className = "chip";
    div.textContent = label;
    div.addEventListener("click", () => {
      if(activeChip === label){
        activeChip = null;
        div.classList.remove("active");
      }else{
        activeChip = label;
        [...chipBox.querySelectorAll(".chip")].forEach(x=>x.classList.remove("active"));
        div.classList.add("active");
      }
      applyFilters();
    });
    return div;
  };

  chipBox.appendChild(makeChip("全部"));
  chipBox.firstChild.classList.add("active");
  chipBox.firstChild.addEventListener("click", () => {
    activeChip = null;
    [...chipBox.querySelectorAll(".chip")].forEach(x=>x.classList.remove("active"));
    chipBox.firstChild.classList.add("active");
    applyFilters();
  });

  top.forEach(t => chipBox.appendChild(makeChip(t)));
}

function applySort(arr){
  const mode = sortSelect.value;
  const copy = [...arr];

  if(mode === "date_desc"){
    copy.sort((a,b)=> parseDate(b.date)-parseDate(a.date));
  }else if(mode === "date_asc"){
    copy.sort((a,b)=> parseDate(a.date)-parseDate(b.date));
  }else if(mode === "title_asc"){
    copy.sort((a,b)=> normalize(a.title).localeCompare(normalize(b.title)));
  }else if(mode === "name_asc"){
    copy.sort((a,b)=> normalize(a.presented_to).localeCompare(normalize(b.presented_to)));
  }
  return copy;
}

function matchesQuery(c, q){
  if(!q) return true;
  const blob = normalize([
    c.title,
    c.date,
    c.presented_to,
    c.id,
    c.topic,
    c.source,
    (c.tags||[]).join(" "),
    c.explanation
  ].join(" | "));
  return blob.includes(q);
}

function matchesChip(c){
  if(!activeChip) return true;
  if(activeChip === "全部") return true;
  return (c.tags || []).includes(activeChip);
}

function applyFilters(){
  const q = normalize(searchInput.value);
  filtered = all.filter(c => matchesQuery(c, q) && matchesChip(c));
  filtered = applySort(filtered);

  renderGrid();
  updateStats();
}

function updateStats(){
  statTotal.textContent = String(all.length);
  statShown.textContent = String(filtered.length);

  if(filtered.length === 0){
    emptyState.classList.remove("hidden");
  }else{
    emptyState.classList.add("hidden");
  }
}

function cardTemplate(c, idx){
  const div = document.createElement("div");
  div.className = "card";
  div.tabIndex = 0;
  div.addEventListener("click", ()=> openModal(idx));
  div.addEventListener("keydown", (e)=>{
    if(e.key === "Enter" || e.key === " "){
      e.preventDefault();
      openModal(idx);
    }
  });

  const thumb = document.createElement("div");
  thumb.className = "thumb";

  const img = document.createElement("img");
  img.src = c.image;
  img.alt = `${c.title} - 证书缩略图`;
  img.loading = "lazy";
  thumb.appendChild(img);

  const body = document.createElement("div");
  body.className = "card-body";

  const title = document.createElement("div");
  title.className = "card-title";
  title.textContent = c.title;

  const meta = document.createElement("div");
  meta.className = "card-meta";
  meta.textContent = `${formatDateCN(c.date)} · Presented to: ${c.presented_to}`;

  const badges = document.createElement("div");
  badges.className = "badge-row";

  const b1 = document.createElement("div");
  b1.className = "badge accent";
  b1.textContent = "APOD CERT";

  const b2 = document.createElement("div");
  b2.className = "badge";
  b2.textContent = c.id;

  badges.appendChild(b1);
  badges.appendChild(b2);

  body.appendChild(title);
  body.appendChild(meta);
  body.appendChild(badges);

  div.appendChild(thumb);
  div.appendChild(body);
  return div;
}

function renderGrid(){
  grid.innerHTML = "";
  filtered.forEach((c, idx)=> grid.appendChild(cardTemplate(c, idx)));
}

function openModal(idx){
  currentIndex = idx;
  const c = filtered[currentIndex];
  if(!c) return;

  mTitle.textContent = c.title;
  mMeta.textContent = `${formatDateCN(c.date)} · ${c.topic ?? ""}`.trim();
  mImg.src = c.image;

  mDate.textContent = formatDateCN(c.date);
  mName.textContent = c.presented_to ?? "—";
  mId.textContent = c.id ?? "—";
  mTopic.textContent = c.topic ?? "—";
  mSource.textContent = c.source ?? "—";
  mExplanation.textContent = c.explanation ?? "—";
  mFile.textContent = c.image ?? "—";

  mTags.innerHTML = "";
  (c.tags || []).forEach(t=>{
    const span = document.createElement("span");
    span.className = "tag";
    span.textContent = t;
    mTags.appendChild(span);
  });

  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeModal(){
  modal.classList.add("hidden");
  document.body.style.overflow = "";
}

function showPrev(){
  if(filtered.length === 0) return;
  currentIndex = (currentIndex - 1 + filtered.length) % filtered.length;
  openModal(currentIndex);
}
function showNext(){
  if(filtered.length === 0) return;
  currentIndex = (currentIndex + 1) % filtered.length;
  openModal(currentIndex);
}

async function init(){
  const res = await fetch("certificates.json");
  all = await res.json();

  filtered = applySort(all);
  buildChips();
  renderGrid();
  updateStats();

  searchInput.addEventListener("input", applyFilters);
  sortSelect.addEventListener("change", applyFilters);
  clearBtn.addEventListener("click", ()=>{
    searchInput.value = "";
    applyFilters();
  });

  modalBackdrop.addEventListener("click", closeModal);
  closeBtn.addEventListener("click", closeModal);
  prevBtn.addEventListener("click", showPrev);
  nextBtn.addEventListener("click", showNext);

  document.addEventListener("keydown", (e)=>{
    if(modal.classList.contains("hidden")) return;
    if(e.key === "Escape") closeModal();
    if(e.key === "ArrowLeft") showPrev();
    if(e.key === "ArrowRight") showNext();
  });
}

init().catch(err=>{
  console.error(err);
  alert("加载失败：请确认 certificates.json / 图片路径是否正确，并用本地服务器打开（见下方说明）。");
});