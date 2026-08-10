/* Lenneuro: Clinician outreach form handler.
 *
 * Powers the inline form on /clinicians (clinicians/index.html).
 * Submits directly to the HubSpot Forms v3 submission API, same portal
 * as assets/ln-signup.js.
 *
 * ---------------------------------------------------------------------------
 * HISTORY: this page used to collect a self-serve virtual letter of intent
 * (credentials, specialty, care setting, monthly volume, a typed signature,
 * and two affirmation checkboxes). That was removed. Clinicians are not the
 * decision makers, most do not know what an LOI is, and every institution
 * runs its own review process. The page now hands off to the clinical
 * education team instead of capturing a signature.
 *
 * The file name and the HubSpot form GUID were kept so existing links and the
 * HubSpot form's submission history stay intact.
 *
 * ---------------------------------------------------------------------------
 * HUBSPOT CHECK BEFORE THIS GOES LIVE (portal 246160635):
 *
 * The "Clinician Letter of Intent" form still has the old LOI properties on
 * it. If any of them are marked REQUIRED on the form, every submission from
 * this page will fail with REQUIRED_FIELD, because this page no longer sends
 * them. Open the form and confirm that only these are required:
 *
 *      firstname   lastname   email   company
 *
 * jobtitle is optional here. lead_type is sent as "Clinicians".
 * The old loi_* properties can be left on the contact record; they simply
 * stop being populated. Run one live test submit and check the contact
 * record before this page is shared.
 * ------------------------------------------------------------------------- */
(function () {
  "use strict";

  var PORTAL_ID = "246160635";

  // "Clinician Letter of Intent" form (portal 246160635).
  var FORM_ID = "51373f27-6442-4409-9ca4-86ef0affc951";

  var ENDPOINT =
    "https://api-na2.hsforms.com/submissions/v3/integration/submit/" +
    PORTAL_ID + "/" + FORM_ID;

  // Enough to shed every optional field one at a time.
  var MAX_RETRIES = 8;

  // Fields that must survive for the submission to be worth anything. If
  // HubSpot rejects one of these there is a real configuration problem.
  var CORE = ["firstname", "lastname", "email"];

  // Setup aid: append HubSpot's own error text to the on-screen message so a
  // failure can be diagnosed from a screenshot. Off now that the page is
  // being shared with clinicians. Full detail still goes to the console.
  var SHOW_RAW_ERRORS = false;

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

  function getCookie(name) {
    var m = document.cookie.match(
      new RegExp("(^|;\\s*)" + name + "=([^;]*)")
    );
    return m ? decodeURIComponent(m[2]) : null;
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
    ["email", "work email"],
    ["company", "hospital or institution"]
  ];

  function validate() {
    var f = form();
    var missing = [];
    var firstBad = null;
    var emailMalformed = false;

    REQUIRED_TEXT.forEach(function (pair) {
      var name = pair[0];
      var el = f.elements[name];
      var v = val(name);
      var bad = !v;
      if (name === "email" && v) {
        bad = !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);
        if (bad) emailMalformed = true;
      }
      markInvalid(el, bad);
      if (bad) {
        if (!(name === "email" && emailMalformed)) missing.push(pair[1]);
        if (!firstBad) firstBad = el;
      }
    });

    if (emailMalformed && !missing.length) {
      showError("That email address doesn't look right. Please check it and try again.");
      focus(f.elements["email"]);
      return false;
    }

    if (missing.length) {
      showError(
        "Please complete the required field" +
        (missing.length > 1 ? "s" : "") + ": " + missing.join(", ") + "."
      );
      focus(firstBad);
      return false;
    }

    hideError();
    return true;
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
      { name: "company", value: val("company") },
      { name: "jobtitle", value: val("jobtitle") },
      { name: "lead_type", value: "Clinicians" }
    ].filter(function (f) { return f.value !== ""; });
  }

  // Pull field names out of HubSpot's FIELD_NOT_IN_FORM_DEFINITION messages,
  // e.g.  Error in 'fields.lead_type'. ... "lead_type" ...
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
            "[Lenneuro clinicians] Submitted, but HubSpot rejected these " +
            "fields because they are not on the form: " + dropped.join(", ") +
            ". Add them to the form (portal " + PORTAL_ID + ", form " +
            FORM_ID + ") so this data is captured."
          );
        }
        return { ok: true, dropped: dropped };
      }

      // Always log the raw exchange. This is the only way to diagnose a
      // HubSpot-side misconfiguration from a browser.
      var errs = (res.data && res.data.errors) || [];
      var hint = "";
      if (errs.some(function (e) { return (e.errorType || "") === "REQUIRED_FIELD"; })) {
        hint = "\nHINT: a field is marked Required on the HubSpot form but " +
          "was not in this payload. The old LOI properties (loi_credentials, " +
          "loi_specialty, loi_care_setting, loi_monthly_catheter_volume, " +
          "loi_typed_signature, loi_date_signed, loi_consent_to_cite) are no " +
          "longer collected on this page. Un-require them on the form.";
      }
      console.error(
        "[Lenneuro clinicians] HubSpot rejected the submission." + hint + "\n" +
        "status: " + res.status + "\n" +
        "response: " + JSON.stringify(res.data, null, 2) + "\n" +
        "sent: " + JSON.stringify(fields, null, 2)
      );

      var bad = rejectedFieldNames(res.data).filter(function (n) {
        return CORE.indexOf(n) === -1;
      });
      if (bad.length && attempt < MAX_RETRIES) {
        var next = fields.filter(function (f) {
          return bad.indexOf(f.name) === -1;
        });
        if (next.length !== fields.length) {
          return submitWithFallback(next, dropped.concat(bad), attempt + 1);
        }
      }

      // Last resort: never lose a real clinician over a config problem.
      // Try name and email alone before giving up.
      var isMinimal = fields.length <= CORE.length;
      if (!isMinimal) {
        var minimal = fields.filter(function (f) {
          return CORE.indexOf(f.name) !== -1;
        });
        return post(minimal).then(function (r2) {
          if (r2.ok) {
            console.error(
              "[Lenneuro clinicians] Only name and email were saved. " +
              "Everything else was rejected by HubSpot. Fix the form. " +
              "See the response logged above."
            );
            return { ok: true, dropped: ["everything except name and email"] };
          }
          return { ok: false, res: res };
        });
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
    var base = "Something went wrong on our end. Please try again, or email " +
      "info@lenneuro.com and we'll reach out directly.";

    if (SHOW_RAW_ERRORS && errors.length) {
      var raw = errors.map(function (e) {
        return (e.errorType || "?") + ": " + (e.message || "");
      }).join(" | ");
      return base + "  [" + res.status + " " + raw + "]";
    }
    if (SHOW_RAW_ERRORS && res && res.status) {
      return base + "  [HTTP " + res.status + ", no error detail returned]";
    }
    return base;
  }

  function setBusy(busy) {
    var btn = $("#ln-loi-submit");
    if (!btn) return;
    btn.disabled = !!busy;
    if (busy) {
      btn.dataset.label = btn.textContent;
      btn.innerHTML = '<span class="ln-spin"></span> Sending…';
    } else {
      btn.innerHTML = btn.dataset.label || "Ask our team to reach out";
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
          "Network error. Your request wasn't sent. Please check your " +
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
})();
