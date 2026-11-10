---
title: "parity:api credits MiniMime's PReadFile class arm"
status: done
updated: 2026-11-10
rfc: "0227-media-gems-residual-parity"
cluster: null
packages:
  - "mini-mime"
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#9952
claim: "2026-11-10T14:13:58Z"
assignee: "mini-mime-pread-file-credited"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api` mini-mime 21/23: `PReadFile#readline` and `#pread`
(`vendor/mini_mime/v1.1.5/lib/mini_mime.rb:88-112`). Both arms are already
ported: `static PReadFile = rbModMethodDefined(File, "pread") ? File : class
PReadFile { readline … pread … }` (`packages/mini-mime/lib/mini-mime.ts:93-111`).
The sibling `static RandomAccessDb = class RandomAccessDb { … }` (:113) is
credited, so the extractor reads a class expression in a static initializer
but not one inside a conditional. This is a credit fix in trails'
`scripts/api-compare/extract-ts-api.ts`, not a port.

## Acceptance criteria

- [ ] The extractor credits the members of a class expression that is a branch
      of a conditional static initializer, under the static's name, with a
      fixture test.
- [ ] No other package's matched count falls; `pnpm parity:api` reports
      mini-mime 23/23.
