---
title: "Rebuild the landing page on rubyonrails.org's structure with trails' own art and copy"
status: done
updated: 2026-11-20
rfc: "0247-website-refresh"
cluster: website-landing
packages: [website]
deps: [website-pages-deploy-workflow]
deps-rfc: []
est-loc: 450
priority: null
pr: trails#10367
claim: "2026-11-19T18:15:53Z"
assignee: "website-landing-page-rebuild"
blocked-by: null
closed-reason: null
---

## Context

RFC § Design 4, which has the section-by-section table and the captured hero
(`assets/rubyonrails-org-hero-2026-11-18.png`). Today's
`packages/website/src/routes/+page.svelte` (459 lines) is a full-bleed SVG
forest hero (`:51-355`), a "Rails to Trails" command table, one code sample
using `static { this.attribute(…) }`, and a six-package grid. It loads Google
Fonts (`:43-47`). Its GitHub links point at the renamed
`blazetrailsdev/blazetrails` (`:58,359,454`).

## Acceptance criteria

- [ ] Before any code, the remaining rubyonrails.org viewports (below the hero, down to the footer) are captured and committed beside the hero in the RFC's `assets/` as the visual spec.
- [ ] The page has the RFC's sections in its order: announcement bar, centered-wordmark nav, hero (fidelity-thesis headline, subhead, lede, version/parity pill, editor frame), community band, "how it is built" block, "everything you need" (four alternating code/text blocks plus the grouped package grid slot), "why a faithful port" block, three getting-started cards, footer.
- [ ] The typography scale and rhythm follow the RFC: a heavy display face for headlines, a neutral sans for body, one accent on a light ground, and centered narrow columns alternating with full-width bands. The trails SVG wordmark is kept. Fonts are self-hosted or system, with no Google Fonts request.
- [ ] No Rails logo, roundel, wordmark, image or copied sentence. The footer has the credit line worded per RFC open question 3.
- [ ] The code blocks are placeholders, clearly marked as such, until `website-landing-walkthrough-from-quickstart` lands. No hand-written snippet is presented as runnable.
- [ ] Every link uses the `base` path and points at `blazetrailsdev/trails`.
- [ ] The PR attaches screenshots of the new page at the same viewport widths as the reference.

## Definition of done

A page that matches the reference's look by reusing its assets or wording
does not close this story.
