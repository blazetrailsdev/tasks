---
title: "Write the Active Record Associations guide"
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
Models) lists this guide as not yet written. Its Rails counterpart is
"Active Record Associations", `vendor/rails/v8.0.2/guides/source/association_basics.md`, listed at
`vendor/rails/v8.0.2/guides/source/documents.yaml:46`. It covers `packages/activerecord`.

Rails Guides are CC BY-SA 4.0 and trails docs are CC BY 4.0
(`LICENSES.md`), so the Rails guide is a structural reference only: its
topic list and section order. The prose is written from scratch, and no
sentence is copied or adapted.

## Acceptance criteria

- [ ] `packages/website/docs/guides/association-basics.md` exists, written from scratch, following the Rails guide's section order where trails has the feature.
- [ ] Every code block compiles under the guides typecheck (`scripts/guides-typecheck/`); a package it imports that is outside CI's `GUIDES_PKGS_RE` is added there.
- [ ] Each trails deviation the guide meets links the package page (`/packages/<pkg>`) or the `CLAUDE.md` section that rules it, rather than restating it.
- [ ] The guides index row for "Active Record Associations" links the guide, and the `/guides/` sidebar lists it.
