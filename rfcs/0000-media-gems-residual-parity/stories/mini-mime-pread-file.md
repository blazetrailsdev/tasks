---
title: "Port MiniMime's PReadFile"
status: draft
updated: 2026-11-09
rfc: "0000-media-gems-residual-parity"
cluster: null
packages:
  - "mini-mime"
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api` mini-mime 21/23: `PReadFile#readline` and `#pread`
(`vendor/mini_mime/v1.1.5/lib/mini_mime.rb:88-112`). The gem assigns
`PReadFile = ::File` when `::File.method_defined?(:pread)`, else defines the
class, the Windows branch. The port keeps both arms on ruby-compat's `File`.

## Acceptance criteria

- [ ] Both arms are ported at the Ruby names in `packages/mini-mime/lib/mini-mime.ts`.
- [ ] A `*.trails.test.ts` constructs the class arm directly over the mini-mime
      database file and checks `readline` and `pread` against `File`'s answers.
