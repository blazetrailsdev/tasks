---
title: "Rebuild the guides index on the Rails Guides table of contents and file a story per unwritten guide"
status: ready
updated: 2026-11-18
rfc: "0247-website-refresh"
cluster: website-docs
packages: [website]
deps: [website-pages-deploy-workflow]
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC § Design 3. `vendor/rails/v8.0.2/guides/source/documents.yaml` lists the
Rails Guides in sections: Start Here (`:2`), Models (`:13`), Views (`:69`),
Controllers (`:97`), Other Components (`:120`), Digging Deeper (`:168`),
Going to Production (`:228`), Advanced Active Record (`:248`), Extending
Rails (`:270`), Contributing (`:309`), Policies (`:327`) and Release Notes
(`:334`). The trails guides index
(`packages/website/docs/guides/index.md`, 195 lines) is a deviations
overview, not a TOC. `LICENSES.md:46-51` forbids copying Rails Guides prose,
since they are CC BY-SA 4.0 (`guides/source/_license.html.erb:1`) and trails
docs are CC BY 4.0. Rails Guides are a structural reference only. The plan
doc `LICENSES.md:51` points to (`docs/rails-guides-migration-plan.md`) does
not exist.

## Acceptance criteria

- [ ] `docs/guides/index.md` lists every guide in the Start Here through Extending Rails sections, in Rails' order. Each row is a written trails guide, "not yet written" linking its story, or "not applicable" with a one-line reason (Asset Pipeline → the Vite ruling in root `CLAUDE.md`; Install Ruby on Rails → Getting Started). Outside those sections, Contributing is one link to `CONTRIBUTING.md`, and Policies and Release Notes are omitted. This matches the RFC's § Design 3 and § Verification.
- [ ] The VitePress `/guides/` sidebar follows the same sections.
- [ ] For each "not yet written" row, a story is filed with `pnpm tasks new <this-rfc> website-guide-<slug> --body-file …`. Each body cites the Rails guide's `vendor/` path and the trails packages it covers, and states that prose is written from scratch.
- [ ] `LICENSES.md`'s pointer to the missing plan doc is resolved as the operator rules on RFC open question 3.
