---
title: "trailmap: store audit reports as Active Storage Disk blobs"
status: ready
updated: 2026-11-07
rfc: "0136-trailmap"
cluster: null
packages: ["activestorage", "activerecord"]
deps:
  - trailmap-app-files-define-their-constants
  - trailmap-bump-trails-to-the-autoloader-importer
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trailmap's audits are markdown files agents write to
`~/.btwhooks/data/github/<owner>/<repo>/audits/*.md`, read by an
ActiveModel `Audit` over `AUDITS_DIR`. Move them into Active Storage on the
Disk service: `Audit` becomes a record with `hasOneAttached :report`, and an
idempotent import attaches each existing file.

## Acceptance

- `@blazetrails/activestorage` vendored (its own PR); the
  `create_active_storage_tables` migration copied by hand (no
  `active_storage:install` yet, see active-storage-install-copies-migrations).
- `config/storage.ts` configures a `local` Disk service.
- `Audit` is an ActiveRecord model (slug, repo, name, size, created
  timestamp) with `hasOneAttached :report`; the audits pages render from it.
- An import walks the audit files, creates one row per file, attaches it,
  and skips files already imported on re-run.
- Rails twin mirrors the model and the import.
- Tests: model, attachment round-trip, importer. Screenshots of the pages.
