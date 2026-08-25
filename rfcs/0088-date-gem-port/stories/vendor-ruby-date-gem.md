---
title: "vendor-ruby-date-gem"
status: done
updated: 2026-08-05
rfc: "0088-date-gem-port"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
pr: 6129
claim: "2026-08-05T15:01:05Z"
assignee: "vendor-ruby-date-gem"
blocked-by: null
closed-reason: null
---

## Context

The RFC 0074 date cluster — `packages/i18n/src/date.ts` (2,554 lines),
`packages/i18n/src/time.ts` (288) — ports `date-3.4.1/ext/date/date_parse.c` and
`ext/date/date_core.c`, which are **not vendored anywhere in the repo**.
`vendor/` holds `rails`, `rack`, `did_you_mean`, `globalid`, `i18n` only, and
`vendor/i18n/lib/i18n/` ships no date implementation. `date.ts`'s JSDoc cites the
C source by line throughout (e.g. `date.ts:2213` cites `date_core.c:186`) against
a file no one can open.

Without a vendored source `parity:api` cannot resolve the cluster —
`scripts/api-compare/extra-surface.ts:12` walks _from each Ruby file_ to its
expected TS file, so a TS file with no counterpart lands in the
`rubyFile === null` slice (`extra-surface.ts:531`), counted but never compared.

This is the first story of the RFC: everything else is measured against what it
lands.

`vendor/sources.ts` is the registry; the `did_you_mean` entry
(`vendor/sources.ts`, `name: "did_you_mean"` → `packages: [{ name: "did-you-mean" }]`)
is the template for the source-name/package-name split.

## Acceptance criteria

- [ ] `vendor/sources.ts` gains a `date` source: `https://github.com/ruby/date.git`
      at `ref: "v3.4.1"` — the version the port already cites.
- [ ] Its one package entry is `{ name: "date", libPath: "lib", testPath: "test/date" }`.
- [ ] `compareApi: false` and `compareTests: false` initially, with a comment
      pointing at the enrollment stories that flip them — the shipped-interim
      pattern RFC 0074 used for i18n.
- [ ] `pnpm vendor:fetch` populates `vendor/date/` with `lib/date.rb`,
      `ext/date/date_parse.c`, `ext/date/date_core.c`, and `test/date/`.
- [ ] `vendor/sources.lock.json` updated.
- [ ] `vendor/sources.test.ts` passes (schema validation: no duplicate names).
- [ ] No TS source changes — this story vendors only.
