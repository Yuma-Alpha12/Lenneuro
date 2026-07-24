/* Lenneuro - custom "Join the list" signup popup.
 * Site-styled two-step modal that maps to the HubSpot form
 * (portal 246160635 / form ed3a0cae-38ca-423f-b713-a94b5fc4c8eb)
 * and submits directly to the HubSpot Forms v3 submission API.
 *
 * Step 1: first name, last name, email (all required)
 * Step 2: "How would you describe your interest?" -> contact property `lead_type`
 *         Clinician -> Clinicians, Patient -> Patients, Investor -> Investors
 *
 * Trigger any element with the attribute  data-open-signup  to open it. */
(function () {
  "use strict";

  var PORTAL_ID = "246160635";
  var FORM_ID = "ed3a0cae-38ca-423f-b713-a94b5fc4c8eb";
  var ENDPOINT =
    "https://api-na2.hsforms.com/submissions/v3/integration/submit/" +
    PORTAL_ID + "/" + FORM_ID;

  // Interest options: display label -> HubSpot internal value for `lead_type`.
  var INTEREST_OPTIONS = [
    { label: "Clinician", value: "Clinicians" },
    { label: "Patient", value: "Patients" },
    { label: "Investor", value: "Investors" }
  ];

  var TEAL = "#17D0B0";
  var reduce =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var root = null; // outer overlay element
  var lastFocus = null;
  var built = false;
  var step = 1;

  function injectStyles() {
    if (document.getElementById("ln-signup-styles")) return;
    var css =
      "#ln-signup-overlay{position:fixed;inset:0;z-index:2147483000;display:flex;" +
      "align-items:center;justify-content:center;padding:24px;" +
      "background:rgba(6,18,24,.72);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);" +
      "opacity:0;visibility:hidden;transition:opacity .28s ease,visibility .28s ease;" +
      "font-family:'Archivo','Helvetica Neue',Helvetica,Arial,sans-serif;}" +
      "#ln-signup-overlay.ln-open{opacity:1;visibility:visible;}" +
      "#ln-signup-card{position:relative;width:100%;max-width:460px;max-height:calc(100vh - 48px);" +
      "overflow:auto;background:radial-gradient(130% 130% at 85% 0%,#1B4A5F 0%,#14384A 46%,#0E2A37 100%);" +
      "border:1px solid rgba(23,208,176,.28);border-radius:20px;padding:34px 32px 30px;" +
      "box-shadow:0 40px 90px -30px rgba(0,0,0,.7);" +
      "transform:translateY(18px) scale(.98);transition:transform .32s cubic-bezier(.2,.7,.2,1);}" +
      "#ln-signup-overlay.ln-open #ln-signup-card{transform:none;}" +
      (reduce
        ? "#ln-signup-overlay,#ln-signup-card{transition:none!important;}"
        : "") +
      ".ln-steps{display:flex;gap:6px;margin-bottom:16px;}" +
      ".ln-steps i{height:4px;flex:1 1 0;border-radius:100px;background:rgba(255,255,255,.14);transition:background .2s ease;}" +
      ".ln-steps i.ln-on{background:" + TEAL + ";}" +
      ".ln-eyebrow{display:inline-flex;align-items:center;background:rgba(23,208,176,.12);" +
      "border:1px solid rgba(23,208,176,.4);color:#5FE6D0;font-size:10.5px;font-weight:700;" +
      "letter-spacing:2.5px;text-transform:uppercase;padding:6px 13px;border-radius:100px;margin-bottom:18px;}" +
      "#ln-signup-card h2{margin:0 0 8px;font-size:26px;font-weight:800;letter-spacing:-.6px;color:#fff;line-height:1.1;}" +
      "#ln-signup-card .ln-sub{margin:0 0 22px;font-size:14px;color:#AFC3CB;line-height:1.5;}" +
      ".ln-field{margin-bottom:14px;}" +
      ".ln-row{display:flex;gap:12px;}" +
      ".ln-row .ln-field{flex:1 1 0;min-width:0;}" +
      ".ln-signup-label{display:block;font-size:12.5px;font-weight:600;color:#DCE7EB;margin-bottom:7px;}" +
      ".ln-signup-label span{color:#5FE6D0;}" +
      ".ln-signup-input{width:100%;background:#0E2A37;border:1px solid rgba(255,255,255,.14);" +
      "border-radius:9px;padding:13px 15px;color:#fff;font-size:15px;font-family:inherit;outline:none;" +
      "transition:border-color .18s ease,box-shadow .18s ease;}" +
      ".ln-signup-input::placeholder{color:#6E858E;}" +
      ".ln-signup-input:focus{border-color:" + TEAL + ";box-shadow:0 0 0 3px rgba(23,208,176,.18);}" +
      ".ln-signup-input.ln-invalid{border-color:#E06B6B;box-shadow:0 0 0 3px rgba(224,107,107,.18);}" +
      ".ln-options{margin-bottom:8px;}" +
      ".ln-opt{display:flex;align-items:center;gap:13px;padding:14px 16px;border:1px solid rgba(255,255,255,.14);" +
      "border-radius:11px;background:#0E2A37;cursor:pointer;margin-bottom:10px;" +
      "transition:border-color .15s ease,background .15s ease;}" +
      ".ln-opt:hover{border-color:rgba(23,208,176,.5);}" +
      ".ln-opt.ln-selected{border-color:" + TEAL + ";background:rgba(23,208,176,.1);}" +
      ".ln-opt input{position:absolute;opacity:0;width:0;height:0;pointer-events:none;}" +
      ".ln-dot{flex:0 0 auto;width:20px;height:20px;border-radius:50%;border:2px solid rgba(255,255,255,.32);" +
      "display:flex;align-items:center;justify-content:center;transition:border-color .15s ease;}" +
      ".ln-opt.ln-selected .ln-dot{border-color:" + TEAL + ";}" +
      ".ln-dot::after{content:'';width:10px;height:10px;border-radius:50%;background:" + TEAL + ";" +
      "transform:scale(0);transition:transform .15s ease;}" +
      ".ln-opt.ln-selected .ln-dot::after{transform:scale(1);}" +
      ".ln-opt .ln-opt-label{font-size:15px;font-weight:600;color:#EAF2F5;}" +
      ".ln-signup-btn{width:100%;margin-top:6px;background:" + TEAL + ";color:#0E2A37;font-weight:700;" +
      "font-size:15.5px;border:none;border-radius:9px;padding:14px;cursor:pointer;font-family:inherit;" +
      "display:inline-flex;align-items:center;justify-content:center;gap:9px;" +
      "transition:transform .15s ease,box-shadow .15s ease,opacity .15s ease;box-shadow:0 6px 18px -8px rgba(23,208,176,.6);}" +
      ".ln-signup-btn:hover{transform:translateY(-2px);box-shadow:0 16px 36px -12px rgba(23,208,176,.8);}" +
      ".ln-signup-btn[disabled]{opacity:.65;cursor:default;transform:none;box-shadow:none;}" +
      ".ln-back{display:block;margin:12px auto 0;background:none;border:none;color:#9FB4BC;font-size:13px;" +
      "font-family:inherit;cursor:pointer;padding:4px 8px;transition:color .15s ease;}" +
      ".ln-back:hover{color:#fff;}" +
      ".ln-note{margin:14px 0 0;font-size:11.5px;color:#6E858E;line-height:1.5;text-align:center;}" +
      ".ln-error{margin:12px 0 0;font-size:12.5px;color:#F0A5A5;line-height:1.5;text-align:center;display:none;}" +
      ".ln-close{position:absolute;top:14px;right:14px;width:34px;height:34px;border-radius:9px;" +
      "border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:#AFC3CB;" +
      "font-size:19px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;" +
      "transition:background .18s ease,color .18s ease;}" +
      ".ln-close:hover{background:rgba(255,255,255,.1);color:#fff;}" +
      ".ln-spin{width:16px;height:16px;border-radius:50%;border:2px solid rgba(14,42,55,.35);" +
      "border-top-color:#0E2A37;animation:lnSignupSpin .7s linear infinite;}" +
      "@keyframes lnSignupSpin{to{transform:rotate(360deg);}}" +
      ".ln-success{text-align:center;padding:14px 4px 6px;}" +
      ".ln-success .ln-check{width:56px;height:56px;margin:0 auto 16px;border-radius:50%;" +
      "background:rgba(23,208,176,.14);border:1px solid rgba(23,208,176,.4);color:#5FE6D0;" +
      "display:flex;align-items:center;justify-content:center;font-size:28px;}" +
      ".ln-success h2{margin:0 0 8px;}" +
      "@media (max-width:480px){.ln-row{flex-direction:column;gap:0;}#ln-signup-card{padding:30px 22px 26px;}#ln-signup-card h2{font-size:23px;}}";
    var s = document.createElement("style");
    s.id = "ln-signup-styles";
    s.textContent = css;
    document.head.appendChild(s);
  }

  function optionsHTML() {
    var html = "";
    for (var i = 0; i < INTEREST_OPTIONS.length; i++) {
      var o = INTEREST_OPTIONS[i];
      html +=
        '<label class="ln-opt">' +
        '<input type="radio" name="lead_type" value="' + o.value + '">' +
        '<span class="ln-dot"></span>' +
        '<span class="ln-opt-label">' + o.label + '</span>' +
        '</label>';
    }
    return html;
  }

  function build() {
    if (built) return;
    built = true;
    injectStyles();

    root = document.createElement("div");
    root.id = "ln-signup-overlay";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-labelledby", "ln-signup-title");
    root.setAttribute("aria-hidden", "true");
    root.innerHTML =
      '<div id="ln-signup-card">' +
      '<button type="button" class="ln-close" aria-label="Close">&times;</button>' +
      '<div class="ln-form-wrap">' +
      '<div class="ln-steps"><i class="ln-on"></i><i></i></div>' +
      '<form novalidate>' +

      // ---- Step 1 ----
      '<div class="ln-step ln-step1">' +
      '<span class="ln-eyebrow">Stay in the loop</span>' +
      '<h2 id="ln-signup-title">Join the list</h2>' +
      '<p class="ln-sub">Get updates on SnapCath\u2122 development milestones, regulatory progress, and future product availability. Unsubscribe anytime.</p>' +
      '<div class="ln-row">' +
      '<div class="ln-field"><label class="ln-signup-label" for="ln-firstname">First name <span>*</span></label>' +
      '<input class="ln-signup-input" type="text" id="ln-firstname" name="firstname" autocomplete="given-name" required></div>' +
      '<div class="ln-field"><label class="ln-signup-label" for="ln-lastname">Last name <span>*</span></label>' +
      '<input class="ln-signup-input" type="text" id="ln-lastname" name="lastname" autocomplete="family-name" required></div>' +
      '</div>' +
      '<div class="ln-field"><label class="ln-signup-label" for="ln-email">Email <span>*</span></label>' +
      '<input class="ln-signup-input" type="email" id="ln-email" name="email" placeholder="you@example.com" autocomplete="email" required></div>' +
      '<button type="submit" class="ln-signup-btn ln-continue">Continue</button>' +
      '<p class="ln-error ln-error-1" role="alert"></p>' +
      '<p class="ln-note">We respect your privacy. Unsubscribe anytime.</p>' +
      '</div>' +

      // ---- Step 2 ----
      '<div class="ln-step ln-step2" style="display:none;">' +
      '<span class="ln-eyebrow">One last step</span>' +
      '<h2>How would you describe your interest?</h2>' +
      '<p class="ln-sub">This helps us send you the most relevant updates.</p>' +
      '<div class="ln-options">' + optionsHTML() + '</div>' +
      '<button type="submit" class="ln-signup-btn ln-final">Join the list</button>' +
      '<p class="ln-error ln-error-2" role="alert"></p>' +
      '<button type="button" class="ln-back">&larr; Back</button>' +
      '</div>' +

      '</form>' +
      '</div>' +

      '<div class="ln-success" style="display:none;">' +
      '<div class="ln-check">\u2713</div>' +
      '<h2>You\u2019re on the list.</h2>' +
      '<p class="ln-sub" style="margin-bottom:6px;">Thanks for your interest in SnapCath\u2122. We\u2019ll keep you posted on our progress.</p>' +
      '</div>' +
      '</div>';
    document.body.appendChild(root);

    root.querySelector(".ln-close").addEventListener("click", close);
    root.addEventListener("mousedown", function (e) {
      if (e.target === root) close();
    });
    root.querySelector("form").addEventListener("submit", onSubmit);
    root.querySelector(".ln-back").addEventListener("click", goToStep1);

    // option selection highlight
    root.querySelector(".ln-options").addEventListener("change", function () {
      Array.prototype.forEach.call(root.querySelectorAll(".ln-opt"), function (l) {
        var input = l.querySelector("input");
        l.classList.toggle("ln-selected", input.checked);
      });
      hideError();
    });
  }

  function setStep(n) {
    step = n;
    root.querySelector(".ln-step1").style.display = n === 1 ? "" : "none";
    root.querySelector(".ln-step2").style.display = n === 2 ? "" : "none";
    var dots = root.querySelectorAll(".ln-steps i");
    dots[0].classList.toggle("ln-on", true);
    dots[1].classList.toggle("ln-on", n === 2);
  }

  function goToStep1() {
    setStep(1);
    hideError();
    var f = root.querySelector("#ln-firstname");
    if (f) f.focus();
  }

  function open() {
    build();
    lastFocus = document.activeElement;
    resetForm();
    root.setAttribute("aria-hidden", "false");
    // force reflow so the transition runs
    void root.offsetWidth;
    root.classList.add("ln-open");
    document.body.style.overflow = "hidden";
    var first = root.querySelector("#ln-firstname");
    if (first) setTimeout(function () { first.focus(); }, reduce ? 0 : 120);
    document.addEventListener("keydown", onKey);
  }

  function close() {
    if (!root) return;
    root.classList.remove("ln-open");
    root.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onKey);
    if (lastFocus && lastFocus.focus) {
      try { lastFocus.focus(); } catch (e) {}
    }
  }

  function onKey(e) {
    if (e.key === "Escape") { close(); return; }
    if (e.key === "Tab") trapFocus(e);
  }

  function trapFocus(e) {
    var f = root.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    f = Array.prototype.filter.call(f, function (el) {
      return el.offsetParent !== null && !el.disabled;
    });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }

  function resetForm() {
    if (!root) return;
    root.querySelector(".ln-form-wrap").style.display = "";
    root.querySelector(".ln-success").style.display = "none";
    var form = root.querySelector("form");
    form.reset();
    Array.prototype.forEach.call(form.querySelectorAll(".ln-invalid"), function (el) {
      el.classList.remove("ln-invalid");
    });
    Array.prototype.forEach.call(root.querySelectorAll(".ln-opt"), function (l) {
      l.classList.remove("ln-selected");
    });
    hideError();
    var btn = root.querySelector(".ln-final");
    btn.disabled = false;
    btn.textContent = "Join the list";
    setStep(1);
  }

  function currentError() {
    return root.querySelector(step === 1 ? ".ln-error-1" : ".ln-error-2");
  }

  function showError(msg) {
    var err = currentError();
    err.textContent = msg;
    err.style.display = "block";
  }

  function hideError() {
    Array.prototype.forEach.call(root.querySelectorAll(".ln-error"), function (e) {
      e.style.display = "none";
      e.textContent = "";
    });
  }

  function onSubmit(e) {
    e.preventDefault();
    if (step === 1) {
      advanceIfValid();
    } else {
      submitForm();
    }
  }

  function advanceIfValid() {
    var form = root.querySelector("form");
    var fn = form.firstname.value.trim();
    var ln = form.lastname.value.trim();
    var em = form.email.value.trim();

    var ok = true;
    [["firstname", fn], ["lastname", ln], ["email", em]].forEach(function (p) {
      var el = form[p[0]];
      var bad = !p[1] || (p[0] === "email" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(p[1]));
      el.classList.toggle("ln-invalid", bad);
      if (bad) ok = false;
    });
    if (!ok) { showError("Please enter your name and a valid email address."); return; }

    hideError();
    setStep(2);
    var firstOpt = root.querySelector('.ln-opt input');
    if (firstOpt) firstOpt.focus();
  }

  function submitForm() {
    var form = root.querySelector("form");
    var fn = form.firstname.value.trim();
    var ln = form.lastname.value.trim();
    var em = form.email.value.trim();
    var interest = form.querySelector('input[name="lead_type"]:checked');

    if (!interest) { showError("Please choose the option that best describes you."); return; }

    var btn = root.querySelector(".ln-final");
    btn.disabled = true;
    btn.innerHTML = '<span class="ln-spin"></span> Joining\u2026';
    hideError();

    var payload = {
      fields: [
        { name: "firstname", value: fn },
        { name: "lastname", value: ln },
        { name: "email", value: em },
        { name: "lead_type", value: interest.value }
      ],
      context: {
        pageUri: window.location.href,
        pageName: document.title
      }
    };

    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(function (r) {
        return r.text().then(function (t) {
          var d = {};
          try { d = t ? JSON.parse(t) : {}; } catch (e) {}
          return { ok: r.ok, status: r.status, data: d };
        });
      })
      .then(function (res) {
        if (res.ok) {
          root.querySelector(".ln-form-wrap").style.display = "none";
          root.querySelector(".ln-success").style.display = "block";
          return;
        }
        var msg = "Something went wrong. Please try again.";
        if (res.data && res.data.errors && res.data.errors.length) {
          var invalidEmail = res.data.errors.some(function (er) {
            return (er.errorType || "").indexOf("EMAIL") !== -1;
          });
          if (invalidEmail) {
            msg = "Please enter a valid email address.";
            btn.disabled = false;
            btn.textContent = "Join the list";
            setStep(1);
            showError(msg);
            return;
          }
        }
        showError(msg);
        btn.disabled = false;
        btn.textContent = "Join the list";
      })
      .catch(function () {
        showError("Network error. Please check your connection and try again.");
        btn.disabled = false;
        btn.textContent = "Join the list";
      });
  }

  // Open via event delegation so it works no matter when triggers render.
  document.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest("[data-open-signup]");
    if (t) { e.preventDefault(); open(); }
  });

  // Expose a manual hook if ever needed.
  window.LNSignup = { open: open, close: close };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
