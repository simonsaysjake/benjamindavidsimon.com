/* Tiny Human — scroll reveals, count-up numbers, animated bars */
(function () {
  "use strict";

  var reduce = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function countUp(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    if (isNaN(target)) return;
    if (reduce) { el.textContent = String(target); return; }

    var dur = 1100;
    var start = null;

    function frame(t) {
      if (start === null) start = t;
      var p = Math.min((t - start) / dur, 1);
      // easeOutCubic
      var eased = 1 - Math.pow(1 - p, 3);
      var val = Math.round(target * eased);
      el.textContent = String(val);
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = String(target);
    }
    requestAnimationFrame(frame);
  }

  function activate(el) {
    el.classList.add("in");
    var counters = el.querySelectorAll("[data-count]");
    for (var i = 0; i < counters.length; i++) countUp(counters[i]);
  }

  var targets = document.querySelectorAll(".reveal");

  if (!("IntersectionObserver" in window)) {
    // Fallback: just show everything
    for (var j = 0; j < targets.length; j++) activate(targets[j]);
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        activate(entry.target);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2, rootMargin: "0px 0px -8% 0px" });

  for (var k = 0; k < targets.length; k++) io.observe(targets[k]);
})();
