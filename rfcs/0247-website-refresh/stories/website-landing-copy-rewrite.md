---
title: "Rewrite the landing page copy in trails' own words"
status: blocked
updated: 2026-11-23
rfc: "0247-website-refresh"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-19T21:21:35Z"
assignee: "website-example-cloudflare-worker"
blocked-by: "trails#10367 merged 2026-11-20, so the rubyonrails.org-derived copy is on main; still blocked on the operator: the rewrite is iterated with the operator (or the operator rules to keep the copy and the RFC records it)"
closed-reason: null
---

## Context

trails#10367 rebuilt `packages/website/src/routes/+page.svelte` on rubyonrails.org's layout. On 2026-11-19 the operator directed that it start from rubyonrails.org's own copy, to be iterated on. So the hero, "You're in good company", "Building it together", "Everything you need", the four code captions, "Optimized for happiness" and "Let's get started" carry rubyonrails.org's sentences, lightly adapted. The operator dropped the editor video: the hero frame holds two tabs, a Rails/trails split of one model and a `tsc` error caught on it (trails#10367). Reference captures are in this RFC's `assets/` (`rubyonrails-org-1440-viewport-*.png`).

## Acceptance criteria

- [ ] Every sentence on the landing page is trails' own wording, iterated with the operator from the rubyonrails.org starting copy. The original "no copied sentence" criterion of `website-landing-page-rebuild` is met, or the operator rules otherwise and the RFC records that ruling.
- [ ] Screenshots at 1440 and 390 are attached to the PR.
