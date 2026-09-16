# SnapCath clinicians page: edit log and claims review

File edited: `clinicians/index.html` (edited in place in the Lenneuro-website folder, ready to push)
Nothing else on the site was touched.
Backup of the pre-edit file is kept off the repo so it will not be committed.

---

## (b) Every change made, before and after

### Item 1. Hero headline

| | |
|---|---|
| **Before** | `<h1>Save Skin, Tubes, and Time</h1>` |
| **After** | `<h1>Life-Proofing Line Care</h1>` |

Matches the homepage H1 exactly. No quantified benefit added.

### Item 2. Duration claims replaced with "long wear"

**2a. Hero lede**

- Before: "...designed to anchor and cover an indwelling vascular access catheter site **for up to 28 days**. Its lid opens for routine site access while the adhesive base stays in place."
- After: "...designed to anchor and cover an indwelling vascular access catheter site **for long wear**. Its lid opens for routine site access while the adhesive base stays in place."

**2b. Device section feature list**

- Before: "Adhesive base with a **28-day** wear objective."
- After: "Adhesive base with a **long wear** objective."

**2c. Hero sub-line (also removes pricing, per your direction)**

- Before: "One device. A 2-minute routine lid-change target. Approximately 35% lower 28-day supply spend."
- After: "One device. A 2-minute routine lid-change target."

**2d. Stat strip footnote**

- Before: "Development-stage figures. 28-day supply comparison assumes four ~$30 standard dressing changes vs. a $25 SnapCath base plus three $17.50 lids. Time comparison uses a 15+ minute current dressing change vs. a ~2 minute SnapCath lid-change target. Clinical outcomes remain under evaluation."
- After: "Development-stage figures. Clinical outcomes remain under evaluation."

No specific duration remains anywhere on the page. Checked in body copy, headings, captions, alt text, the page title and the aria-labels. There is no meta description on this page and no comparison table.

### Item 3. Value case section deleted

**3a. Whole `<section class="section value" id="value">` removed.** Everything inside it is gone:

- Eyebrow "The institutional value case"
- H2 "A seamless workflow integration with a straightforward value case."
- "The value analysis conversation should not require a complicated ROI story. The SnapCath savings case is clear."
- Dark panel "Time and cost move together." plus its body copy
- Metric boxes: Current supply bundle ~$120 → SnapCath model $77.50
- Metric boxes: Current change time 15+ min → Routine lid target ~2 min
- Callout "87% time savings weekly"
- "~$1,111 estimated combined supply + nursing-time savings per patient per year in the current company model*"
- Panel "The patient-facing value is built into the same design." plus its body copy
- All four bullets: Less adhesive disruption (60% less adhesive skin contact, 75% fewer peeling events), Fewer care steps, Home-care potential, Clinical outcomes
- Footnote "*Company model shows: ~$559 annual supply savings + ~$552 annual nursing-time savings per patient. Nursing-time model uses $49/hour and 13 cycles/year."

No placeholder and no empty heading left behind.

**3b. Nav link removed**

- Before: `<a href="#value">Value case</a>`
- After: (removed from the nav)

**3c. Hero anchor button removed**

- Before: `<a class="btn secondary" href="#value">See the value case</a>`
- After: (removed; the hero now has one button, "Try it yourself")

**3d. CSS anchor offset**

- Before: `#why,#value,#device,#connect{scroll-margin-top:80px}`
- After: `#why,#device,#connect{scroll-margin-top:80px}`

**3e. Dead CSS removed** for the deleted section only: the `/* economic case */` block (`.value`, `.value-head`, `.value-grid`, `.value-panel`, `.metric-row`, `.metric-box`, `.arrow`, `.metric-callout`, `.value-note`, `.annual`, `.bullet-grid`, `.bullet`) and the matching lines in the mobile media queries. No rule still in use was touched.

### Item 3 follow-on. Stat strip under the hero, per your direction

Two of the four tiles removed:

- Removed: "Nursing time / 15+ → ~2 min / Current bundle change vs. SnapCath routine lid-change target."
- Removed: "Supply spend / ~35% lower / ~$120 vs. $77.50 per 28-day cycle in company analysis."
- Kept: "Skin disruption / 75% fewer / Adhesive-peeling events in Lenneuro development testing."
- Kept: "Products / 1 device / Designed to combine catheter securement and site coverage."

Grid changed from 4 columns to 2 so the two remaining tiles fill the row:

- Before: `.proof{...grid-template-columns:repeat(4,1fr);...}`
- After: `.proof{...grid-template-columns:repeat(2,1fr);...}`

### Item 4. "What clinicians are saying" deleted

Whole `<div class="quotes">` block removed, including:

- Kicker "What clinicians are saying in customer discovery"
- Quote 1: "The day of the Tegaderm may be over, this is so simple and effective!" / RN, Vascular Access Specialist
- Quote 2: "As a home infusion nurse, I love your new dressing device." / RN, MSN, Senior Director, Largest US independent infusion provider
- Quote 3: "I see a lot of potential here. I'm interested in using the SnapCath for my patients when it becomes available." / RN, Vascular Access Specialist, Inpatient, outpatient, and mobile settings

There were no headshots or star ratings on the page. Nothing in the nav or any anchor pointed at this block, so no link changes were needed. Dead CSS for `.quotes`, `.quotes-title`, `.quote-grid` and the `blockquote` rules was removed, plus the matching mobile media query line.

### Item 5. No other copy rewritten

Everything else is exactly as it was. Markup verified: all tags balanced, page renders correctly at desktop and mobile widths.

---

## Two things worth a look before you push

**1. The hero eyebrow now repeats the headline.** The eyebrow above the H1 already said "Life Proofing Line Care", so the hero currently reads "LIFE PROOFING LINE CARE" and then "Life-Proofing Line Care" directly underneath. I left it because you said not to rewrite other copy. Say the word and I will drop the eyebrow.

**2. The hero disclaimer still mentions cost.** It reads "Cost and time figures on this page reflect company analysis and development targets under evaluation, not demonstrated clinical or economic performance." There are no cost figures left on the page. Over-disclaiming is harmless, so I left it, but you may want it trimmed to "Time figures..." once Abbey does her pass.

---

## (c) Remaining claims for Brittany's regulatory review

Nothing below was changed. Listed by section, roughly highest risk first.

### The device section

1. **"Stronger than any other anchor on the market in bench testing."**
   Comparative superiority claim against all competitors. Highest-risk sentence on the page.
2. **"Removable, disposable, shower-proof, tamper-proof lid."**
   Performance claims: shower-proof and tamper-proof.
3. **"Adhesive base with a long wear objective."**
   Performance claim, now unquantified but still a wear-duration claim.
4. **"The current SnapCath prototype pairs an adhesive base that stays on the skin with a removable lid that opens and closes over the site."**
   Performance claim: base stays on the skin.

### Stat strip under the hero

5. **"75% fewer" / "Adhesive-peeling events in Lenneuro development testing."**
   Quantified comparative performance claim from internal testing.
6. **"1 device" / "Designed to combine catheter securement and site coverage."**
   Functional claim. Lower risk, framed as design intent.

### Hero

7. **"One device. A 2-minute routine lid-change target."**
   Quantified time/performance claim, framed as a target.
8. **"SnapCath is a single device designed to anchor and cover an indwelling vascular access catheter site for long wear."**
   Performance claim: anchor, cover, long wear.

### The clinical story section

9. **"...then access the site without peeling the adhesive base off the skin every time."**
   Performance claim about repeated access without adhesive removal.
10. **"The base, shell, and lid are designed as one system around the catheter site, reducing the number of separate products clinical teams need to apply, stock, and teach."**
    Economic and workflow claim: fewer products to stock.
11. **"The adhesive base is designed to remain in place while the lid opens for access. That is the core workflow change behind the time target and the reduction in repeated adhesive peeling."**
    Performance claim plus a time claim by reference.
12. **"Lenneuro is developing SnapCath for line care across inpatient, outpatient infusion, dialysis, long-term care, and home settings so the device and technique can stay consistent as care moves."**
    Indication-adjacent claim. Names specific care settings and patient populations.

### Who this page is for

13. **"Programs where consistent technique, repeated access, supply management, and continuity across settings can compound over time."**
    Soft economic/benefit claim. Low risk, hedged.

### Next step

14. **"Learn how to life-proof line care with SnapCath."**
    Brand line rather than a substantive claim. Listed for completeness.

### Footer

15. The FDA and development-stage disclaimer paragraph is unchanged and still accurate for everything left on the page.
