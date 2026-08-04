/* Lenneuro: Clinician Letter of Intent form handler.
 *
 * Powers the inline form on /clinicians (clinicians/index.html).
 * Submits directly to the HubSpot Forms v3 submission API, same portal
 * as assets/ln-signup.js.
 *
 * ---------------------------------------------------------------------------
 * SETUP (do this once in HubSpot, portal 246160635):
 *
 * 1. Create a new form named "Clinician Letter of Intent".
 * 2. Add these fields to it (contact properties). Create any that don't exist:
 *
 *      firstname                    (default)  single-line text
 *      lastname                     (default)  single-line text
 *      email                        (default)  single-line text
 *      phone                        (default)  single-line text
 *      company                      (default)  single-line text  -> institution
 *      jobtitle                     (default)  single-line text
 *      lead_type                    (existing) dropdown          -> "Clinicians"
 *      ln_credentials               (new)      single-line text
 *      ln_specialty                 (new)      dropdown
 *      ln_care_setting              (new)      dropdown
 *      ln_catheter_volume_monthly   (new)      dropdown
 *      ln_loi_comments              (new)      multi-line text
 *      ln_loi_signature_name        (new)      single-line text
 *      ln_loi_signed_date           (new)      date picker
 *      ln_loi_citation_consent      (new)      single checkbox
 *      ln_loi_updates_opt_in        (new)      single checkbox
 *
 *    IMPORTANT for the three dropdowns: HubSpot matches on the option's
 *    internal value. When you create an option by typing only a label,
 *    HubSpot sets the internal value equal to that label. So this page
 *    sends the label text verbatim, e.g. "Critical care / ICU", and the
 *    HubSpot option labels must read EXACTLY the same, punctuation and
 *    spacing included. The full list is in HUBSPOT-SETUP.md.
 *
 *    A mismatch here does not throw: the contact is still created and the
 *    dropdown is simply left empty or holds an off-list value. Verify with
 *    one live test submit and check the contact record before sharing the
 *    page. This is the single most likely thing to be quietly wrong.
 *
 * 3. Paste the new form's GUID into FORM_ID below.
 *
 * Until step 3 is done the script still works: HubSpot rejects unknown fields
 * with FIELD_NOT_IN_FORM_DEFINITION, and this script automatically retries
 * without the rejected fields so the contact is never lost. It logs a warning
 * to the console listing what was dropped.
 * ------------------------------------------------------------------------- */
(function () {
  "use strict";

  var PORTAL_ID = "246160635";

  // "Clinician Letter of Intent" form (portal 246160635).
  var FORM_ID = "51373f27-6442-4409-9ca4-86ef0affc951";

  var ENDPOINT =
    "https://api-na2.hsforms.com/submissions/v3/integration/submit/" +
    PORTAL_ID + "/" + FORM_ID;

  var MAX_RETRIES = 4; // retries after dropping fields HubSpot rejects

  // ---- helpers -----------------------------------------------------------

  function $(sel, scope) { return (scope || document).querySelector(sel); }

  function form() { return document.getElementById("ln-loi-form"); }

  function val(name) {
    var f = form();
    if (!f) return "";
    var el = f.elements[name];
    if (!el) return "";
    return (el.value || "").trim();
  }

  function checked(name) {
    var f = form();
    if (!f) return false;
    var el = f.elements[name];
    return !!(el && el.checked);
  }

  function getCookie(name) {
    var m = document.cookie.match(
      new RegExp("(^|;\\s*)" + name + "=([^;]*)")
    );
    return m ? decodeURIComponent(m[2]) : null;
  }

  function todayISO() {
    var d = new Date();
    var m = String(d.getMonth() + 1);
    var day = String(d.getDate());
    return (
      d.getFullYear() + "-" +
      (m.length < 2 ? "0" + m : m) + "-" +
      (day.length < 2 ? "0" + day : day)
    );
  }

  function markInvalid(el, bad) {
    if (!el) return;
    if (el.classList) el.classList.toggle("ln-invalid", !!bad);
  }

  function showError(msg) {
    var box = $("#ln-loi-error");
    if (!box) return;
    box.textContent = msg;
    box.style.display = "block";
    try {
      box.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (e) {
      box.scrollIntoView();
    }
  }

  function hideError() {
    var box = $("#ln-loi-error");
    if (!box) return;
    box.style.display = "none";
    box.textContent = "";
  }

  // ---- validation --------------------------------------------------------

  var REQUIRED_TEXT = [
    ["firstname", "first name"],
    ["lastname", "last name"],
    ["ln_credentials", "credentials"],
    ["email", "email address"],
    ["company", "institution or practice"],
    ["jobtitle", "role or title"],
    ["ln_specialty", "specialty"],
    ["ln_care_setting", "care setting"],
    ["ln_catheter_volume_monthly", "approximate monthly volume"],
    ["ln_loi_signature_name", "signature"]
  ];

  function validate() {
    var f = form();
    var missing = [];
    var firstBad = null;

    REQUIRED_TEXT.forEach(function (pair) {
      var name = pair[0];
      var el = f.elements[name];
      var v = val(name);
      var bad = !v;
      if (name === "email" && v) {
        bad = !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);
      }
      markInvalid(el, bad);
      if (bad) {
        missing.push(pair[1]);
        if (!firstBad) firstBad = el;
      }
    });

    // Signature must plausibly match the name given above.
    var sig = val("ln_loi_signature_name").toLowerCase().replace(/[^a-z]/g, "");
    var last = val("lastname").toLowerCase().replace(/[^a-z]/g, "");
    var sigMismatch = sig && last && sig.indexOf(last) === -1;

    // Required affirmations
    var affirmEl = f.elements["ln_loi_affirm"];
    var consentEl = f.elements["ln_loi_citation_consent"];
    var affirmBad = !checked("ln_loi_affirm");
    var consentBad = !checked("ln_loi_citation_consent");
    toggleCheckboxError(affirmEl, affirmBad);
    toggleCheckboxError(consentEl, consentBad);

    if (missing.length) {
      showError(
        "Please complete the required field" +
        (missing.length > 1 ? "s" : "") + ": " + missing.join(", ") + "."
      );
      focus(firstBad);
      return false;
    }
    if (affirmBad || consentBad) {
      showError(
        "Please check the box" + (affirmBad && consentBad ? "es" : "") +
        " confirming the statement above before signing."
      );
      focus(affirmBad ? affirmEl : consentEl);
      return false;
    }
    if (sigMismatch) {
      showError(
        "Your typed signature doesn't match the name you entered above. " +
        "Please type your full name exactly as it should appear on the letter."
      );
      markInvalid(f.elements["ln_loi_signature_name"], true);
      focus(f.elements["ln_loi_signature_name"]);
      return false;
    }

    hideError();
    return true;
  }

  function toggleCheckboxError(el, bad) {
    if (!el) return;
    var row = el.closest ? el.closest(".ln-check-row") : null;
    if (row && row.classList) row.classList.toggle("ln-invalid-row", !!bad);
  }

  function focus(el) {
    if (!el || !el.focus) return;
    try {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (e) {}
    setTimeout(function () { try { el.focus(); } catch (e) {} }, 120);
  }

  // ---- submission --------------------------------------------------------

  function buildFields() {
    return [
      { name: "firstname", value: val("firstname") },
      { name: "lastname", value: val("lastname") },
      { name: "email", value: val("email") },
      { name: "phone", value: val("phone") },
      { name: "company", value: val("company") },
      { name: "jobtitle", value: val("jobtitle") },
      { name: "lead_type", value: "Clinicians" },
      { name: "ln_credentials", value: val("ln_credentials") },
      { name: "ln_specialty", value: val("ln_specialty") },
      { name: "ln_care_setting", value: val("ln_care_setting") },
      { name: "ln_catheter_volume_monthly", value: val("ln_catheter_volume_monthly") },
      { name: "ln_loi_comments", value: val("ln_loi_comments") },
      { name: "ln_loi_signature_name", value: val("ln_loi_signature_name") },
      { name: "ln_loi_signed_date", value: todayISO() },
      { name: "ln_loi_citation_consent", value: checked("ln_loi_citation_consent") ? "true" : "false" },
      { name: "ln_loi_updates_opt_in", value: checked("ln_loi_updates_opt_in") ? "true" : "false" }
    ].filter(function (f) { return f.value !== ""; });
  }

  // Pull field names out of HubSpot's FIELD_NOT_IN_FORM_DEFINITION messages,
  // e.g.  Error in 'fields.ln_specialty'. ... "ln_specialty" ...
  function rejectedFieldNames(data) {
    var names = [];
    var errors = (data && data.errors) || [];
    errors.forEach(function (er) {
      var type = er.errorType || "";
      var msg = er.message || "";
      if (type.indexOf("FIELD_NOT_IN_FORM_DEFINITION") === -1 &&
          type.indexOf("INVALID_FIELD") === -1 &&
          msg.indexOf("not in the form definition") === -1 &&
          msg.indexOf("does not exist") === -1) return;
      var m = msg.match(/fields\.([A-Za-z0-9_]+)/);
      if (m) { names.push(m[1]); return; }
      m = msg.match(/["']([A-Za-z0-9_]+)["']/);
      if (m) names.push(m[1]);
    });
    return names;
  }

  function post(fields) {
    var payload = {
      fields: fields,
      context: {
        pageUri: window.location.href,
        pageName: document.title
      }
    };
    var hutk = getCookie("hubspotutk");
    if (hutk) payload.context.hutk = hutk;

    return fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (r) {
      return r.text().then(function (t) {
        var d = {};
        try { d = t ? JSON.parse(t) : {}; } catch (e) {}
        return { ok: r.ok, status: r.status, data: d };
      });
    });
  }

  function submitWithFallback(fields, dropped, attempt) {
    return post(fields).then(function (res) {
      if (res.ok) {
        if (dropped.length) {
          console.warn(
            "[Lenneuro LOI] Submitted, but HubSpot rejected these fields " +
            "because they are not on the form: " + dropped.join(", ") +
            ". Add them to the Clinician Letter of Intent form (and set " +
            "FORM_ID in assets/ln-loi.js) so this data is captured."
          );
        }
        return { ok: true, dropped: dropped };
      }

      var bad = rejectedFieldNames(res.data);
      if (bad.length && attempt < MAX_RETRIES) {
        var next = fields.filter(function (f) {
          return bad.indexOf(f.name) === -1;
        });
        if (next.length !== fields.length) {
          return submitWithFallback(next, dropped.concat(bad), attempt + 1);
        }
      }
      return { ok: false, res: res };
    });
  }

  function errorMessageFor(res) {
    var errors = (res && res.data && res.data.errors) || [];
    for (var i = 0; i < errors.length; i++) {
      var t = errors[i].errorType || "";
      if (t.indexOf("EMAIL") !== -1) {
        return "That email address wasn't accepted. Please check it and try again.";
      }
      if (t.indexOf("BLOCKED") !== -1) {
        return "This submission was blocked. Please email info@lenneuro.com and we'll take it from there.";
      }
    }
    return "Something went wrong on our end. Please try again, or email info@lenneuro.com and we'll record your letter manually.";
  }

  function setBusy(busy) {
    var btn = $("#ln-loi-submit");
    if (!btn) return;
    btn.disabled = !!busy;
    if (busy) {
      btn.dataset.label = btn.textContent;
      btn.innerHTML = '<span class="ln-spin"></span> Submitting…';
    } else {
      btn.innerHTML = btn.dataset.label || "Sign and submit";
    }
  }

  function showSuccess() {
    var wrap = $("#ln-loi-form-wrap");
    var done = $("#ln-loi-success");
    var name = val("firstname");
    if (wrap) wrap.style.display = "none";
    if (done) {
      var greeting = $("#ln-loi-success-name");
      if (greeting && name) greeting.textContent = "Thank you, " + name + ".";
      done.style.display = "block";
      try {
        done.scrollIntoView({ behavior: "smooth", block: "center" });
      } catch (e) {
        done.scrollIntoView();
      }
    }
  }

  function onSubmit(e) {
    var f = e.target;
    if (!f || f.id !== "ln-loi-form") return;
    e.preventDefault();

    // honeypot: bots fill hidden inputs
    var hp = f.elements["ln_hp"];
    if (hp && hp.value) { showSuccess(); return; }

    if (!validate()) return;

    setBusy(true);
    submitWithFallback(buildFields(), [], 0)
      .then(function (out) {
        if (out.ok) { showSuccess(); return; }
        setBusy(false);
        showError(errorMessageFor(out.res));
      })
      .catch(function () {
        setBusy(false);
        showError(
          "Network error. Your letter wasn't submitted. Please check your " +
          "connection and try again, or email info@lenneuro.com."
        );
      });
  }

  // Delegated so it survives re-renders and late-rendering markup.
  document.addEventListener("submit", onSubmit, true);

  // Clear the error styling as the user fixes things.
  document.addEventListener("input", function (e) {
    var t = e.target;
    if (!t || !t.classList) return;
    if (t.classList.contains("ln-invalid")) t.classList.remove("ln-invalid");
  });
  document.addEventListener("change", function (e) {
    var t = e.target;
    if (!t || t.type !== "checkbox") return;
    if (t.checked) toggleCheckboxError(t, false);
  });

  // Stamp today's date into the signature block.
  function stampDate() {
    var el = document.getElementById("ln-loi-date");
    if (!el) return;
    var d = new Date();
    el.textContent = d.toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric"
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", stampDate);
  } else {
    stampDate();
  }
})();
