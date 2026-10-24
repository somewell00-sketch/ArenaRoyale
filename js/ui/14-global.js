/* ---------- global clicks ---------- */
document.addEventListener('click', e => {
  const fv = e.target.closest('[data-fav]');
  if(fv){ toggleFav(fv.dataset.fav); return; }
  const step = e.target.closest('[data-step]');
  if(step){ const i = +step.dataset.step; selPhase = S.stats.find(s => s.p === i) || (S.live && S.live.p === i) ? i : null; renderStepper(); renderPhase(); showTab('phase'); closeModal(); window.scrollTo({top: $('stepper').offsetTop - 12, behavior:'smooth'}); return; }
  if(e.target.closest('[data-run]')){ $('bStep').click(); return; }
  if(e.target.closest('[data-skip]')){ stopReplay(); return; }
  const zd = e.target.closest('[data-zday]');
  if(zd){ zDay = +zd.dataset.zday; renderPhase(); return; }
  if(e.target.closest('[data-replay]')){ startReplay(); render(); return; }
  const mc = e.target.closest('[data-match]');

  if(e.target.closest('[data-people]')){ openPeople(); return; }
  const alf = e.target.closest('[data-alf]');
  if(alf){ alFilter = alf.dataset.alf; alShow = 40; renderAlliancesTab(); return; }
  if(e.target.closest('[data-almore]')){ alShow += 40; renderAlliancesTab(); return; }
  const ar = e.target.closest('[data-arch]');
  if(ar){ openArchive(+ar.dataset.arch); return; }
  const sh = e.target.closest('[data-seathist]');
  if(sh){ const k = sh.dataset.seathist, box = sh.nextElementSibling; if(CC_OPEN.has(k)) CC_OPEN.delete(k); else CC_OPEN.add(k); if(box) box.toggleAttribute('hidden', !CC_OPEN.has(k)); sh.setAttribute('aria-expanded', CC_OPEN.has(k)); return; }
  const hr = e.target.closest('[data-hunter]');
  if(hr){ openHunter(hr.dataset.hunter); return; }
  const hs = e.target.closest('[data-hasort]');
  if(hs){ const k = hs.dataset.hasort; if(haSort === k) haDir = haDir === 'asc' ? 'desc' : 'asc'; else { haSort = k; haDir = HA_TEXT.includes(k) ? 'asc' : 'desc'; } haPage = 0; renderAssociation(); return; }
  const hp = e.target.closest('[data-hap]');
  if(hp){ haPage += +hp.dataset.hap; renderAssociation(); return; }
  const po = e.target.closest('[data-po]');
  if(po){ pOrigin = po.dataset.po; document.querySelectorAll('[data-po]').forEach(b => b.setAttribute('aria-pressed', b === po)); drawGrid(); return; }
  const pf = e.target.closest('[data-pf]');
  if(pf){ pFilter = pf.dataset.pf; document.querySelectorAll('[data-pf]').forEach(b => b.setAttribute('aria-pressed', b === pf)); drawGrid(); return; }
  const t = e.target.closest('[data-id]');
  if(t){ if(!t.closest('.modal')) modalBack = null; openProfile(t.dataset.id); }
});
document.addEventListener('keydown', e => {
  if(e.key !== 'Enter') return;
  if(e.target.classList?.contains('license')) openProfile(e.target.dataset.id);
  if(e.target.dataset?.people !== undefined) openPeople();
});

boot();
