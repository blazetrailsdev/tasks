---
title: "Rewrite the landing page copy in trails' own words and record the editor video"
status: draft
updated: 2026-11-19
rfc: "0247-website-refresh"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10367 rebuilt `packages/website/src/routes/+page.svelte` on rubyonrails.org's layout. On 2026-11-19 the operator directed that it start from rubyonrails.org's own copy, to be iterated on. So the hero, "You're in good company", "Building it together", "Everything you need", the four code captions, "Optimized for happiness" and "Let's get started" carry rubyonrails.org's sentences, lightly adapted. The editor video is a placeholder box (operator: reproduce it as a later step). Reference captures are in this RFC's `assets/` (`rubyonrails-org-1440-viewport-*.png`).

## Acceptance criteria

- [ ] Every sentence on the landing page is trails' own wording, iterated with the operator from the rubyonrails.org starting copy. The original "no copied sentence" criterion of `website-landing-page-rebuild` is met, or the operator rules otherwise and the RFC records that ruling.
- [ ] The hero's video placeholder is replaced with a trails editor recording, made the way the reference's is, or is filed as its own story.
- [ ] Screenshots at 1440 and 390 are attached to the PR.
