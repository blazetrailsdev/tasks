---
title: "Write the Securing Rails Applications guide"
status: ready
updated: 2026-11-19
rfc: "0247-website-refresh"
cluster: website-docs
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC § Design 3, filed by `website-guides-index-follows-rails-guides`. The
trails guides index (`packages/website/docs/guides/index.md`, section
Going to Production) lists this guide as not yet written. Its Rails counterpart is
"Securing Rails Applications", `vendor/rails/v8.0.2/guides/source/security.md`, listed at
`vendor/rails/v8.0.2/guides/source/documents.yaml:240`. It covers `packages/actionpack`, `packages/activerecord`, `packages/activesupport`.

Rails Guides are CC BY-SA 4.0 and trails docs are CC BY 4.0
(`LICENSES.md`), so the Rails guide is a structural reference only: its
topic list and section order. The prose is written from scratch, and no
sentence is copied or adapted.

## Acceptance criteria

- [ ] `packages/website/docs/guides/security.md` exists, written from scratch, following the Rails guide's section order where trails has the feature.
- [ ] Every code block compiles under the guides typecheck (`scripts/guides-typecheck/`); a package it imports that is outside CI's `GUIDES_PKGS_RE` is added there.
- [ ] Each trails deviation the guide meets links the package page (`/packages/<pkg>`) or the `CLAUDE.md` section that rules it, rather than restating it.
- [ ] The guides index row for "Securing Rails Applications" links the guide, and the `/guides/` sidebar lists it.
