---
title: 'Port MiniMime''s PReadFile and the "full parity with mime types" test'
status: draft
updated: 2026-11-09
rfc: "0000-media-gems-residual-parity"
cluster: null
packages:
  - "mini-mime"
deps: []
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

`pnpm parity:api` mini-mime 21/23: `PReadFile#readline` and `#pread`
(`vendor/mini_mime/v1.1.5/lib/mini_mime.rb:88-112`, the Windows branch taken
when `::File` lacks `pread`). `pnpm parity:test` 8/9: `test_full_parity_with_mime_types`
(`vendor/mini_mime/v1.1.5/test/mini_mime_test.rb:109`) walks `MIME::Types` and
compares each extension's content type with `MiniMime.lookup_by_filename`. The
mime-types gem is not vendored.

## Acceptance criteria

- [ ] `PReadFile` is ported at its Ruby name in `packages/mini-mime/lib/mini-mime.ts`.
- [ ] mime-types and mime-types-data are vendored through `vendor/sources.ts`
      (`compareApi` / `compareTests` off), and the test is ported by name,
      reading that data.
