(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var prog = document.getElementById("prog");
  var word = document.querySelector(".wordmark");
  var model = document.querySelector(".model");
  var bagCount = document.getElementById("bag-count");
  var bagCountMenu = document.getElementById("bag-count-menu");
  var bag = 0;
  var ticking = false;

  function cubicBezier(x1, y1, x2, y2) {
    return function (x) {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      var t = x;
      var i;
      for (i = 0; i < 8; i++) {
        var cx = 3 * x1;
        var bx = 3 * (x2 - x1) - cx;
        var ax = 1 - cx - bx;
        var xEst = ((ax * t + bx) * t + cx) * t;
        var dx = (3 * ax * t + 2 * bx) * t + cx;
        if (Math.abs(dx) < 1e-6) break;
        t = Math.max(0, Math.min(1, t - (xEst - x) / dx));
      }
      var cy = 3 * y1;
      var by = 3 * (y2 - y1) - cy;
      var ay = 1 - cy - by;
      return ((ay * t + by) * t + cy) * t;
    };
  }

  var easeOut = cubicBezier(0.19, 1, 0.22, 1);

  function revealHero() {
    var seq = document.querySelectorAll(".hero-seq");
    seq.forEach(function (el, i) {
      window.setTimeout(function () {
        el.classList.add("in");
      }, reduce ? 0 : 140 * i);
    });
  }

  function bindReveal() {
    var nodes = document.querySelectorAll(".rv");
    if (reduce || !("IntersectionObserver" in window)) {
      nodes.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var siblings = Array.prototype.filter.call(el.parentElement.children, function (n) {
          return n.classList && n.classList.contains("rv");
        });
        var index = siblings.indexOf(el);
        window.setTimeout(function () {
          el.classList.add("in");
        }, Math.max(0, index) * 70);
        io.unobserve(el);
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });
    nodes.forEach(function (el) { io.observe(el); });
  }

  function bindCounts() {
    var nums = document.querySelectorAll("[data-count]");
    if (reduce || !("IntersectionObserver" in window)) return;
    nums.forEach(function (el) { el.textContent = "0"; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var target = Number(el.getAttribute("data-count"));
        var start = performance.now();
        var dur = 1400;
        function frame(now) {
          var t = Math.min(1, (now - start) / dur);
          el.textContent = String(Math.round(easeOut(t) * target));
          if (t < 1) requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
        io.unobserve(el);
      });
    }, { threshold: 0.6 });
    nums.forEach(function (el) { io.observe(el); });
  }

  function bindVideo() {
    var video = document.getElementById("cloth-video");
    if (!video || !("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          if (!video.getAttribute("src")) {
            video.src = video.getAttribute("data-src");
          }
          var play = video.play();
          if (play && play.catch) play.catch(function () {});
        } else if (video.getAttribute("src")) {
          video.pause();
        }
      });
    }, { threshold: 0.25 });
    io.observe(video);
  }

  function onScroll() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    var ratio = max > 0 ? window.scrollY / max : 0;
    if (ratio < 0) ratio = 0;
    if (ratio > 1) ratio = 1;
    prog.style.transform = "scaleX(" + ratio + ")";

    if (reduce) return;

    var y = window.scrollY;
    word.style.transform = "translate3d(-50%, calc(-50% + " + (y * 0.14) + "px), 0)";
    model.style.transform = "translate(-50%, calc(-50% + " + (y * -0.06) + "px)) scale(" + (1 + y * 0.00006) + ")";

    var season = document.querySelector(".season-img");
    if (season) {
      var r = season.getBoundingClientRect();
      var p = (window.innerHeight - r.top) / (window.innerHeight + r.height);
      var shift = (p - 0.5) * 48;
      season.style.transform = "scale(1.12) translate3d(0," + shift + "px,0)";
    }

    document.querySelectorAll(".look-img").forEach(function (img) {
      var rect = img.getBoundingClientRect();
      var start = window.innerHeight * 0.92;
      var end = window.innerHeight * 0.28;
      var t = (start - rect.top) / (start - end);
      if (t < 0) t = 0;
      if (t > 1) t = 1;
      img.style.setProperty("--p", t.toFixed(4));
    });
  }

  function requestScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      onScroll();
      ticking = false;
    });
  }

  function setBag(n) {
    bag = n;
    bagCount.textContent = String(bag);
    bagCountMenu.textContent = String(bag);
  }

  document.querySelectorAll("[data-add]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      setBag(bag + 1);
      var label = btn.textContent;
      btn.textContent = "Added";
      window.setTimeout(function () {
        btn.textContent = label === "Added" ? "Add to bag" : "Add to bag";
      }, 1300);
    });
  });

  document.querySelectorAll(".fav").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var on = btn.getAttribute("aria-pressed") === "true";
      btn.setAttribute("aria-pressed", on ? "false" : "true");
    });
  });

  var toggle = document.querySelector(".nav-toggle");
  var menu = document.getElementById("menu");
  toggle.addEventListener("click", function () {
    var open = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", open ? "false" : "true");
    menu.hidden = open;
  });
  menu.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      toggle.setAttribute("aria-expanded", "false");
      menu.hidden = true;
    });
  });

  var form = document.getElementById("signup-form");
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var note = document.getElementById("form-note");
    note.textContent = "You’re on the list. The next letter leaves with the run.";
    form.reset();
  });

  revealHero();
  bindReveal();
  bindCounts();
  bindVideo();
  onScroll();
  window.addEventListener("scroll", requestScroll, { passive: true });
  window.addEventListener("resize", requestScroll);
})();
