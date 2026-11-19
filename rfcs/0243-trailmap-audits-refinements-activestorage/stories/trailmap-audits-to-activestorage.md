---
title: "trailmap: Audit is a Base record with an attached body"
status: claimed
updated: 2026-11-19
rfc: "0243-trailmap-audits-refinements-activestorage"
cluster: audits
packages: ["activestorage", "activerecord"]
deps:
  - trailmap-configures-active-storage-on-base
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: "2026-11-19T12:37:47Z"
assignee: "refinement-is-a-base-record-with-an-attached-summary"
blocked-by: null
closed-reason: null
---

## Context

Moved from 0123 into this RFC and narrowed to the model. The parts it used to
bundle now have their own stories: vendoring
(`trailmap-bump-trails-for-activestorage`), configuration
(`trailmap-configures-active-storage-on-base`) and the import
(`import-existing-audits-and-refine-reports`). Its blocker,
`trails-tsc-build-views-runs-initializers-before-engines`, is done
(trails#10009). The WIP (trailmap
`origin/wip/trailmap-audits-to-activestorage-build-views`, 9ca1442) is a
useful start, but it puts `audits` on Hub. The operator ruled `Base`.

Today `app/models/audit.ts` is an ActiveModel over `AUDITS_DIR`:

- `all()` at `:63-91` (readdir, then stat, then sort by mtime);
- `findBy` / `find` at `:98-110`, with the `RecordNotFound` message at
  `:27-29`;
- `id` / `isPersisted` at `:118-124`, `title` at `:127-129`, `isHtml` at
  `:132-134`, and `read()` at `:139-151`.

Its JSDoc (`:37-44`) cites RFC 0136's file-backed ruling
(`rfcs/0136-trailmap/README.md:495-497`), which this RFC reverses. The routes
(`config/routes.ts`, the `audits` resource with `AUDIT_SEGMENT`, the `raw`
member and the `audits/view/:file` redirect),
`app/controllers/audits-controller.ts` and `app/views/audits/` are the
contract to keep.

## Acceptance criteria

- [ ] `Audit extends ApplicationRecord` on `Base`, with `slug`, `title`,
      `format`, `repo`, `writtenAt` and `hasOneAttached("body")`. Add the
      `db/migrate` mirror at the tasks twin's version, the `db/schema.ts`
      entry and `tableOwners.audits = "trailmap"`.
- [ ] `toParam` answers the legacy `<slug>-<YYYYMMDDTHHMMSSZ>.<format>`.
      `Audit.find(name)` parses it and raises today's `RecordNotFound`.
      `title`, `isHtml()`, `size` (the blob's `byteSize`) and `when`
      (`writtenAt`) keep their names. `read()` becomes `body.download`. The
      ordering is `writtenAt desc`.
- [ ] The controller, routes and both views are unchanged, apart from
      dropping the "no AUDITS_DIR" empty state. The JSDoc no longer cites
      0136's ruling and names this RFC instead.
- [ ] Model and controller tests run on fixtures with attached bodies. The
      `rails/` twin mirrors the model. Screenshots of `/audits`, one `.md`
      audit and the raw view are in the PR.
