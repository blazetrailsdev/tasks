---
title: "Port mini_mime's full-parity-with-mime-types test over vendored mime-types data"
status: in-progress
updated: 2026-11-10
rfc: "0227-media-gems-residual-parity"
cluster: null
packages:
  - "mini-mime"
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#9951
claim: "2026-11-10T14:04:49Z"
assignee: "mini-mime-full-parity-with-mime-types-test"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:test` mini-mime 8/9: `test_full_parity_with_mime_types`
(`vendor/mini_mime/v1.1.5/test/mini_mime_test.rb:109`) walks `MIME::Types`
(`each`, `type_for`, `obsolete?`, `registered`, `extensions`, `content_type`)
and compares each extension's type with `MiniMime.lookup_by_filename`. Neither
mime-types nor mime-types-data is vendored.

## Acceptance criteria

- [ ] mime-types-data is vendored through trails' `vendor/sources.ts`, data
      only (`compareApi` / `compareTests` off, with the reason).
- [ ] The six `MIME::Types` calls the test makes are a test-support helper in
      `packages/mini-mime/test/support/` over that data, citing mime-types'
      `file:line` for each; the mime-types gem itself is not ported.
- [ ] The test is ported by name and passes.
