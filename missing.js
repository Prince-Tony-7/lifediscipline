/* Life Discipline: alert for days that weren't logged (add-on to index.html). */
(function () {
  var MISSING = null, TOLD = false;
  function nice(k) {
    var d = new Date(k + 'T12:00:00Z');
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getUTCDay()] + ' ' + d.getUTCDate() + ' ' +
      ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getUTCMonth()];
  }
  function badge() {
    var tab = document.querySelector('#tabs button[data-m=checkin]');
    if (!tab) return;
    var b = tab.querySelector('.mbadge');
    var n = MISSING ? MISSING.length : 0;
    if (!n) { if (b) b.remove(); return; }
    if (!b) { b = document.createElement('span'); b.className = 'mbadge'; tab.appendChild(b); }
    b.textContent = n;
  }
  function banner() {
    var old = document.getElementById('missingBanner');
    if (old) old.remove();
    if (typeof MODE !== 'undefined' && MODE !== 'checkin') return;
    if (!D || D.readOnly || !MISSING || !MISSING.length) return;
    var list = MISSING.filter(function (m) { return m.date !== D.date; });
    var here = MISSING.some(function (m) { return m.date === D.date; });
    var div = document.createElement('div');
    div.id = 'missingBanner';
    div.className = 'mban' + (here ? ' here' : '');
    var html = '<div class="mtitle">' + (here
      ? '✏️ This day isn’t logged yet — fill it in and tap Save.'
      : '⚠️ ' + MISSING.length + ' day' + (MISSING.length === 1 ? '' : 's') + ' not logged') + '</div>';
    if (list.length) {
      html += (here ? '<div class="msub">Also still to do:</div>' : '') + '<div class="mchips">' + list.map(function (m) {
        return '<button data-go="' + m.date + '">' + nice(m.date) + (m.partial ? ' · half done' : '') + '</button>';
      }).join('') + '</div>';
    }
    div.innerHTML = html;
    var main = document.getElementById('main');
    main.insertBefore(div, main.firstChild);
    Array.prototype.forEach.call(div.querySelectorAll('[data-go]'), function (b) {
      b.onclick = function () {
        if (dirty && !confirm('You have unsaved changes. Leave this day without saving?')) return;
        dirty = false; load(D.name, b.getAttribute('data-go'));
      };
    });
  }
  function refresh() {
    if (!OWNER || !KEY) return;
    google.script.run.withSuccessHandler(function (r) {
      MISSING = (r && r.missing) || [];
      badge(); banner();
      if (!TOLD && MISSING.length) { TOLD = true; toast('⚠️ ' + MISSING.length + ' day' + (MISSING.length === 1 ? '' : 's') + ' not logged yet', true); }
    }).withFailureHandler(function () { /* script not updated yet — no alert */ }).getMissingDays(OWNER, KEY);
  }
  // Hook into the page: after every render, drop days that are now logged and redraw the alert.
  var orig = window.render;
  window.render = function () {
    orig.apply(this, arguments);
    if (MISSING && D && !D.readOnly && D.summary && D.summary.logged) {
      MISSING = MISSING.filter(function (m) { return m.date !== D.date; });
      badge();
    }
    banner();
    if (MISSING === null && D && OWNER) { MISSING = []; refresh(); }
  };
  var origMode = window.setMode;
  window.setMode = function (m) { origMode(m); banner(); };
  // re-check when the app comes back to the front (e.g. opened from the home screen the next day)
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') refresh(); });
  var st = document.createElement('style');
  st.textContent =
    '.mban{background:#fff4e5;border:1.5px solid #ffb74d;color:#7a4100;border-radius:14px;padding:12px 14px;margin:0 0 12px}' +
    '.mban.here{background:#e8f5e9;border-color:#81c784;color:#1b5e20}' +
    '.mtitle{font-weight:700;font-size:15px}.msub{font-size:12px;margin-top:6px;opacity:.8}' +
    '.mchips{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.mchips button{border:0;background:#ef6c00;color:#fff;font-weight:700;font-size:13px;border-radius:16px;padding:7px 12px}' +
    '.mban.here .mchips button{background:#455a64}' +
    '#tabs button{position:relative}.mbadge{position:absolute;top:-6px;right:-4px;background:#e53935;color:#fff;font-size:11px;font-weight:800;min-width:20px;height:20px;line-height:20px;border-radius:10px;padding:0 5px;box-shadow:0 0 0 2px #263238}';
  document.head.appendChild(st);
  if (typeof D !== 'undefined' && D && OWNER) { MISSING = []; refresh(); }   // page already loaded before this file
})();
