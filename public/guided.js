(function() {
  'use strict';
  const STEPS = [
    { title: "Try the broken button", desc: "This example is broken on purpose. Try Generate Report. Your click will not reach the button.", mode: "original" },
    { title: "See what blocked it", desc: "An inactive loading layer sits above the button. It is invisible, but still catches clicks. The fix lets clicks through only while the layer is inactive.", mode: "original" },
    { title: "Try the fixed button", desc: "Try Generate Report again. The same button now works with the repaired CSS. The Kane result is separate, recorded proof.", mode: "repaired" }
  ];
  const $ = id => document.getElementById(id);
  const state = { step: 1, evidence: null, error: false };

function routeViews() {
  const hash = window.location.hash || '#home';
  const homeView = document.getElementById('home-view');
  const demoView = document.getElementById('demo-view');
  
  let demoStep = 0;
  
  if (/^#demo\/[123]$/.test(hash)) {
    const step = parseInt(hash.split('/')[1], 10);
    if (step >= 1 && step <= 3) {
      demoStep = step;
    }
  }
  
  const isDemo = demoStep > 0;
  const validAnchors = ['#home', '#how-it-works', '#evidence', '#example-preview'];
  const isHomeOrAnchor = !isDemo && (validAnchors.includes(hash) || hash === '');

  // Default unknown hashes to home
  if (!isDemo && !isHomeOrAnchor) {
    window.location.hash = '#home';
    return 0;
  }
  
  if (homeView && demoView) {
    homeView.classList.toggle('active', !isDemo);
    demoView.classList.toggle('active', isDemo);
  }
  
  return demoStep;
}

function focusRoute(demoStep) {
  const hash = window.location.hash || '#home';
  
  if (demoStep > 0) {
    window.scrollTo(0, 0);
    const stepTitle = document.querySelector('#demo-view #step-title') || document.querySelector('#demo-view h1');
    if (stepTitle) {
      stepTitle.setAttribute('tabindex', '-1');
      stepTitle.focus({ preventScroll: true });
    }
  } else if (hash === '#home' || hash === '') {
    window.scrollTo(0, 0);
    const mainH1 = document.querySelector('#home-view h1');
    if (mainH1) {
      mainH1.setAttribute('tabindex', '-1');
      mainH1.focus({ preventScroll: true });
    }
  } else {
    const target = document.querySelector(hash);
    if (target) {
      target.scrollIntoView({ behavior: 'auto' });
      const heading = target.querySelector('h1, h2, h3') || target;
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    } else {
      window.scrollTo(0, 0);
      const mainH1 = document.querySelector('#home-view h1');
      if (mainH1) {
        mainH1.setAttribute('tabindex', '-1');
        mainH1.focus({ preventScroll: true });
      }
    }
  }
}


  function render() {
    const demoStep = routeViews();
    if (!demoStep) return;
    state.step = demoStep;
    const cur = STEPS[state.step - 1];
    $('step-label').textContent = `Step ${state.step} of 3`;
    $('step-title').textContent = cur.title;
    $('step-description').textContent = cur.desc;
    $('prev-step').hidden = state.step === 1;
    $('prev-step').disabled=false;
    $('prev-step').textContent='Back';
    $('click-feedback').hidden=true;
    $('click-feedback').textContent='';
    $('click-feedback').classList.remove('success');
    $('preview-label').textContent=state.step===3?'REPAIRED CSS':state.step===2?'INVISIBLE LAYER REVEALED':'ORIGINAL CSS';
    $('demo-frame').title=state.step===3?'Repaired CSS interactive reproduction':'Original CSS interactive reproduction';
    $('next-step').textContent = state.step === 3 ? 'Try the example again' : state.step===1?'See what blocked it':'Try the fixed button';

    document.querySelectorAll('.step-num').forEach(el => {
      const active = parseInt(el.dataset.step, 10) === state.step;
      el.classList.toggle('active', active);
      if (active) el.setAttribute('aria-current', 'step'); else el.removeAttribute('aria-current');
    });

    const targetSrc = `/viewer-fixture/index.html?mode=${cur.mode}`;
    const iframe = $('demo-frame');
    if (!iframe.src.endsWith(targetSrc)) { iframe.inert = true; iframe.src = targetSrc; }
    else updateIframeState(iframe);
  }

  function updateIframeState(iframe) {
    try {
      const doc = iframe.contentDocument;
      if (!doc || doc.readyState !== 'complete') return;
      iframe.contentWindow.postMessage({ type: 'TOGGLE_OUTLINES', enabled: state.step === 2 }, location.origin);
      if (!doc._bound) {
        doc._bound = true;
        doc.addEventListener('click', e => {
          const fb = $('click-feedback');
          if (state.step === 1 && e.target.closest('.loading-overlay')) {
            fb.hidden=false;fb.textContent = "Your click hit the invisible loading layer, not the button. This is the bug.";
          } else if (state.step === 3 && e.target.closest('#generate-btn')) {
            fb.hidden=false;fb.classList.add("success");fb.textContent = "Report generated. You just tried the repaired reproduction, not a new Kane test.";
          }
        });
      }
      iframe.inert = false;
    } catch(e) {}
  }

  $('demo-frame').addEventListener('load', e => updateIframeState(e.target));

  window.addEventListener('hashchange', () => {
    render();
    focusRoute(state.step && /^#demo\/[123]$/.test(location.hash) ? state.step : 0);
  });

  $('next-step').addEventListener('click', () => {
    if (state.step === 3) window.location.hash = '#demo/1';
    else window.location.hash = `#demo/${state.step + 1}`;
  });

  $('prev-step').addEventListener('click', () => {
    if (state.step > 1) window.location.hash = `#demo/${state.step - 1}`;
  });

  const details = $('evidence-details');
  let pending=false;
  function el(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;}
  function disclosure(title,text){const d=el('details',undefined,'proof-data');d.append(el('summary',title),el('pre',text||'Not recorded'));return d;}
  function https(v){try{const u=new URL(v);return u.protocol==='https:'?u.href:null;}catch{return null;}}
  function proofCard(result,label,diag,img){const c=el('article',undefined,'proof-card');c.append(el('h3',label));const status=result?.passed===true?'PASSED':result?.passed===false?'FAILED':'NOT VERIFIED';c.append(el('span',status,'verdict'+(status==='PASSED'?' passed':'')));const hits=diag?.hitTestResults;if(Array.isArray(hits))c.append(el('p',hits.filter(h=>h.obstructed===true).length+'/'+hits.length+' recorded points blocked. Exit '+String(result?.exitCode??'not recorded')+'.'));if(typeof img==='string'&&/^\/evidence\/[a-zA-Z0-9_.-]+$/.test(img)){const a=el('a');a.href=img;a.target='_blank';a.rel='noopener';const shot=el('img');shot.src=img;shot.alt=label+' screenshot from the recorded run';shot.className='proof-shot';a.append(shot);c.append(a);}const url=https(result?.runEnd?.test_url);if(url){const a=el('a','Open original Kane report ↗');a.href=url;a.target='_blank';a.rel='noopener noreferrer';c.append(a);}if(result?.runEnd?.summary)c.append(disclosure('Kane reported',result.runEnd.summary));return c;}
  async function loadEvidence(){if(pending||state.evidence)return;pending=true;const box=$('evidence-content');box.replaceChildren(el('p','Loading the recorded evidence…','loading'));try{const r=await fetch('/evidence/recorded-run.json');if(!r.ok)throw Error();const d=await r.json();if(!d||typeof d!=='object')throw Error();box.replaceChildren(el('p','Recorded on 17 November 2026. Kane failed before the source change and passed afterward on the unchanged objective. This page does not run a new test.','proof-note'));const grid=el('div',undefined,'proof-grid');grid.append(proofCard(d.baselineResult,'Before repair',d.diagnostic,d.screenshots?.before),proofCard(d.verifyResult,'After repair',d.afterDiagnostic,d.screenshots?.after));box.append(grid,el('p','Gemini repair was web-assisted. The active-loading regression still blocks clicks. Automatic authenticated Gemini CLI repair is not verified. The local runner has documented upstream dependency risks.','proof-note'),disclosure('What the test had to prove',String(d.objective??'Not recorded')+'\n\nSHA-256: '+String(d.objectiveSha256??'Not recorded')),disclosure('View the actual CSS source change',d.diff),disclosure('Read the recorded run events',Array.isArray(d.logs)?d.logs.join('\n'):'Not recorded'));const a=el('a','Download recorded evidence JSON','data-link');a.href='/evidence/recorded-run.json';a.download='z-index-sleuth-recorded-evidence.json';box.append(a);state.evidence=d;}catch{const p=el('p','Recorded evidence could not be loaded. The interactive example is still available.','error');const btn=el('button','Retry evidence','btn secondary');btn.onclick=loadEvidence;box.replaceChildren(p,btn);}finally{pending=false;}}
  details.addEventListener('toggle',()=>{if(details.open)loadEvidence();});
  document.querySelectorAll('[data-open-proof]').forEach(a=>a.addEventListener('click',()=>{details.open=true;}));
  render();
  if (location.hash) focusRoute(/^#demo\/[123]$/.test(location.hash)?state.step:0);
})();
