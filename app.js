/* Tiny Human — reveals, count-up, live status, theme, peekaboo, confetti, konami */
(function () {
  "use strict";

  var reduce = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Scroll reveal + count-up ---------- */
  function countUp(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    if (isNaN(target)) return;
    if (reduce) { el.textContent = String(target); return; }
    var dur = 1100, start = null;
    function frame(t) {
      if (start === null) start = t;
      var p = Math.min((t - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(frame); else el.textContent = String(target);
    }
    requestAnimationFrame(frame);
  }
  function activate(el) {
    el.classList.add("in");
    var c = el.querySelectorAll("[data-count]");
    for (var i = 0; i < c.length; i++) countUp(c[i]);
  }
  var targets = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { activate(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.2, rootMargin: "0px 0px -8% 0px" });
    for (var k = 0; k < targets.length; k++) io.observe(targets[k]);
  } else {
    for (var j = 0; j < targets.length; j++) activate(targets[j]);
  }

  /* ---------- Theme toggle ---------- */
  var toggle = document.getElementById("themeToggle");
  function isNight() { return document.documentElement.getAttribute("data-theme") === "night"; }
  function syncToggle() { if (toggle) toggle.setAttribute("aria-pressed", isNight() ? "true" : "false"); }
  syncToggle();
  if (toggle) {
    toggle.addEventListener("click", function () {
      var night = !isNight();
      if (night) document.documentElement.setAttribute("data-theme", "night");
      else document.documentElement.removeAttribute("data-theme");
      try { localStorage.setItem("theme", night ? "night" : "day"); } catch (e) {}
      syncToggle();
    });
  }

  /* ---------- Live System Status ---------- */
  var LABEL = {
    operational: "Operational", maint: "Maintenance",
    degraded: "Degraded", partial: "Partial Outage", major: "Major Outage"
  };
  var RANK = { operational: 0, maint: 1, degraded: 2, partial: 3, major: 4 };

  function statuses(h) {
    var night = h < 5, earlyAM = h === 5, morning = h >= 6 && h <= 8,
        lateAM = h >= 9 && h <= 11, noon = h === 12, nap = h === 13,
        afternoon = h >= 14 && h <= 16, preDinner = h === 17, dinner = h === 18,
        routine = h === 19, bedtime = h >= 20 && h <= 21, asleep = h >= 22;
    var s = {};
    // Sleep API
    if (night) s.sleep = ["degraded", "Intermittent 3 AM wake events"];
    else if (earlyAM) s.sleep = ["degraded", "Early wake event detected"];
    else if (nap) s.sleep = ["maint", "Scheduled nap in progress"];
    else if (routine) s.sleep = ["maint", "Bedtime routine initializing"];
    else if (bedtime) s.sleep = ["maint", "Bedtime — do not disturb"];
    else if (asleep) s.sleep = ["maint", "Sleeping · nominal"];
    else s.sleep = ["operational", "Awake and alert"];
    // Feeding
    if (night) s.feed = ["maint", "Night feeding window"];
    else if (morning) s.feed = ["operational", "Breakfast served"];
    else if (noon) s.feed = ["operational", "Lunch served"];
    else if (dinner) s.feed = ["operational", "Dinner served"];
    else if (asleep || bedtime) s.feed = ["operational", "Idle"];
    else s.feed = ["operational", "Snacks available"];
    // Diaper
    if (morning) s.diaper = ["degraded", "Elevated throughput (post-breakfast)"];
    else s.diaper = ["operational", "Within normal parameters"];
    // Vocalization
    if (h < 3) s.voice = ["major", "Inconsolable — gas suspected"];
    else if (night) s.voice = ["degraded", "Sporadic fussing"];
    else if (routine) s.voice = ["degraded", "Sleep protest active"];
    else if (lateAM || afternoon) s.voice = ["operational", "Babbling (consonants)"];
    else s.voice = ["operational", "Cooing"];
    // Mobility
    if (night || asleep) s.mobility = ["maint", "Offline — recharging"];
    else if (nap || bedtime) s.mobility = ["maint", "Paused"];
    else if (lateAM) s.mobility = ["operational", "Crawling at speed"];
    else if (afternoon) s.mobility = ["operational", "Cruising furniture"];
    else s.mobility = ["operational", "Online"];
    // Mood & Cuteness
    if (night || earlyAM) s.mood = ["degraded", "Fussy · low cache hit"];
    else if (preDinner || routine) s.mood = ["degraded", "Overtired"];
    else s.mood = ["operational", "Peak cuteness · 100%"];
    return s;
  }

  function renderStatus() {
    var now = new Date();
    var h = now.getHours();
    var data = statuses(h);
    var worst = 0;
    var comps = document.querySelectorAll(".comp");
    for (var i = 0; i < comps.length; i++) {
      var key = comps[i].getAttribute("data-key");
      var d = data[key]; if (!d) continue;
      var pill = comps[i].querySelector(".comp__pill");
      var note = comps[i].querySelector(".comp__note");
      pill.setAttribute("data-s", d[0]);
      pill.textContent = LABEL[d[0]];
      note.textContent = d[1];
      if (RANK[d[0]] > worst) worst = RANK[d[0]];
    }
    var banner = document.getElementById("statusBanner");
    var text = banner.querySelector(".status__btext");
    var sev = "operational", msg = "All systems operational";
    if (worst >= 4) { sev = "major"; msg = "Major outage — one or more systems down"; }
    else if (worst >= 2) { sev = "degraded"; msg = "Degraded performance"; }
    else if (worst >= 1) { sev = "maint"; msg = "Scheduled maintenance in progress"; }
    banner.setAttribute("data-sev", sev);
    text.textContent = msg;
    var time = document.getElementById("statusTime");
    try {
      time.textContent = "as of " + now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) + " · your time";
    } catch (e) { time.textContent = ""; }
  }

  function buildUptime() {
    var host = document.getElementById("uptimeBars");
    if (!host) return;
    var warn = { 12: 1, 13: 1, 40: 1, 41: 1, 66: 1, 81: 1 };
    var down = { 27: 1, 72: 1 };
    var html = "";
    for (var i = 0; i < 90; i++) {
      var cls = down[i] ? " class=\"down\"" : (warn[i] ? " class=\"warn\"" : "");
      html += "<i" + cls + "></i>";
    }
    host.innerHTML = html;
  }

  if (document.getElementById("components")) { renderStatus(); buildUptime(); }

  /* ---------- Confetti + toast ---------- */
  var layer, toastEl;
  function ensureLayer() {
    if (!layer) { layer = document.createElement("div"); layer.className = "confetti-layer"; document.body.appendChild(layer); }
    return layer;
  }
  var COLORS = ["#cc0000", "#1c4587", "#34a853", "#f5a623", "#8ab4f8", "#ffd66e"];
  function confetti(x, y, count) {
    if (reduce) return;
    var host = ensureLayer();
    for (var i = 0; i < count; i++) {
      var b = document.createElement("div");
      b.className = "confetti-bit";
      b.style.background = COLORS[(Math.random() * COLORS.length) | 0];
      host.appendChild(b);
      animateBit(b, x, y);
    }
  }
  function animateBit(b, px, py) {
    var ang = Math.random() * Math.PI * 2, vel = 4 + Math.random() * 7;
    var vx = Math.cos(ang) * vel, vy = Math.sin(ang) * vel - (6 + Math.random() * 4);
    var rot = Math.random() * 360, vr = (Math.random() - 0.5) * 40;
    var life = 0, max = 60 + Math.random() * 30;
    function step() {
      life++; vy += 0.45; px += vx; py += vy; rot += vr;
      b.style.left = px + "px"; b.style.top = py + "px";
      b.style.transform = "rotate(" + rot + "deg)";
      b.style.opacity = String(Math.max(0, 1 - life / max));
      if (life < max && py < window.innerHeight + 40) requestAnimationFrame(step);
      else b.parentNode && b.parentNode.removeChild(b);
    }
    requestAnimationFrame(step);
  }
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement("div"); toastEl.className = "toast"; document.body.appendChild(toastEl); }
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(function () { toastEl.classList.remove("show"); }, 1900);
  }

  // Confetti on "Shipped" roadmap cards
  var shipped = document.querySelectorAll(".lane:first-child .card");
  for (var c = 0; c < shipped.length; c++) {
    shipped[c].addEventListener("click", function (e) {
      var r = this.getBoundingClientRect();
      confetti(e.clientX || (r.left + r.width / 2), e.clientY || (r.top + r.height / 2), 34);
      toast("Shipped to production!");
    });
  }

  /* ---------- Peekaboo (click the logo) ---------- */
  var brand = document.querySelector(".brand");
  var peek = document.getElementById("peekaboo");
  var peekTxt = peek ? peek.querySelector(".peekaboo__txt") : null;
  var peekBusy = false;
  function setPeekTxt(s) { if (peekTxt) peekTxt.textContent = s; }
  if (brand && peek) {
    brand.addEventListener("click", function () {
      if (reduce || peekBusy) return; // let it just scroll to top
      peekBusy = true;
      peek.classList.remove("open");
      setPeekTxt("Where’s Benji?");
      peek.classList.remove("done");
      peek.classList.add("show");                 // slow cover (~1.15s), hold while covered
      setTimeout(function () {                     // after cover + ~1s pause, reveal
        setPeekTxt("There he is!");
        peek.classList.add("open");
      }, 2200);
      setTimeout(function () {                     // let "There he is!" linger, then fade out
        peek.classList.add("done");
      }, 3800);
      setTimeout(function () {                     // reset
        peek.classList.remove("show", "open", "done");
        peekBusy = false;
      }, 4400);
    });
  }

  /* ---------- Hero name → random nickname ---------- */
  var heroName = document.getElementById("heroName");
  if (heroName) {
    var NAMES = ["Benjamin David Simon", "Ben-Jammin’", "Benji", "Benjito", "B-Dog", "Ben", "Mr. Boy"];
    function swapName() {
      var cur = heroName.textContent.trim(), pick = cur;
      while (pick === cur) pick = NAMES[(Math.random() * NAMES.length) | 0];
      heroName.textContent = pick;
      heroName.classList.remove("swap");
      void heroName.offsetWidth; // restart animation
      if (!reduce) heroName.classList.add("swap");
    }
    heroName.addEventListener("click", swapName);
    heroName.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); swapName(); }
    });
  }

  /* ---------- Konami code ---------- */
  var SEQ = ["arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a"];
  var pos = 0;
  document.addEventListener("keydown", function (e) {
    var k = (e.key || "").toLowerCase();
    if (k === SEQ[pos]) {
      pos++;
      if (pos === SEQ.length) { pos = 0; party(); }
    } else {
      pos = (k === SEQ[0]) ? 1 : 0;
    }
  });
  var partyEl = document.getElementById("party");
  var partyBusy = false;
  function party() {
    if (partyBusy) return;
    partyBusy = true;
    toast("Achievement unlocked: Founder Mode");
    if (partyEl) partyEl.classList.add("show");
    if (!reduce) {
      confetti(window.innerWidth / 2, window.innerHeight * 0.45, 90); // big center burst
      var n = 0;
      var t = setInterval(function () {
        confetti(Math.random() * window.innerWidth, -10, 24);                   // rain from top
        confetti(40, window.innerHeight - 16, 16);                              // bottom-left jet
        confetti(window.innerWidth - 40, window.innerHeight - 16, 16);          // bottom-right jet
        if (++n > 22) clearInterval(t);                                         // ~4s
      }, 180);
    }
    setTimeout(function () {
      if (partyEl) partyEl.classList.remove("show");
      partyBusy = false;
    }, 4200);
  }
})();
