---
title: "Write the Getting Started guide from the CI-run README Quickstart"
status: draft
updated: 2026-11-18
rfc: "0247-website-refresh"
cluster: website-docs
packages: [website]
deps: [website-guides-index-follows-rails-guides]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC § Design 3–4. The root `README.md` Quickstart (`:31` on) is run command
by command in CI, and each output block is diffed by
`scripts/quickstart/run.sh` (`:1-36`; `quickstart` job,
`.github/workflows/ci.yml:1304-1316`). It is the one walkthrough known to
work. The Rails counterpart is "Getting Started with Rails"
(`vendor/rails/v8.0.2/guides/source/documents.yaml:5`). Use it for structure
only, per `LICENSES.md:46-51`.

## Acceptance criteria

- [ ] `docs/guides/getting-started.md` walks `trails new` → generate a model and migrate → generate a controller and route → `trails server`, in prose written for trails.
- [ ] Every command and output block is read at build time from the README Quickstart (by a VitePress markdown include or a build-time extraction sharing `run.sh`'s block selector), not copied.
- [ ] Any step the guide needs that the Quickstart lacks (the controller step, if missing) is added to the README Quickstart, and `scripts/quickstart/run.sh` passes with it.
- [ ] The guides index row for Getting Started links the page.
