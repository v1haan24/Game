const $=s=>document.querySelector(s),app=$('#app');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ord=y=>['','1st','2nd','3rd','4th'][y]+' Year';
const PLAN=['easy','easy','medium','medium','hard','hist','search'];
const LBL={easy:'EASY',medium:'MEDIUM',hard:'HARD',hist:'SPECIAL · TIMELINE',search:'SPECIAL · MEANING'};
