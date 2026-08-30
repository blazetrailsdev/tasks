---
title: "Vendor ruby/ruby at v3_3_11 as the MRI read-anchor for ruby-compat citations"
status: ready
updated: 2026-08-30
rfc: "0129-ruby-compat"
cluster: null
packages: ["ruby-compat"]
deps: []
deps-rfc: []
est-loc: 150
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Every ruby-compat port cites MRI C source by symbol, and none of it is readable
in-tree. `packages/date/src/date.ts:1225-1240` cites `rational.c`
`nurat_s_canonicalize_internal`, `nurat_add`, `float_to_r`;
`packages/activesupport/src/range-ext.ts:1-9` cites `range.c`
`range_include_internal` and `str_upto_each`;
`packages/activesupport/src/core-ext/regexp.ts:1-3` cites `re.c`
`rb_reg_s_quote`; `rb-equal.ts:1-9` cites `object.c` `rb_equal`. A reviewer
cannot check any of them.

`vendor/sources.ts` is the registry (`SOURCES`, `:63`), `vendor/fetch.ts` the
fetcher, `vendor/sources.lock.json` the pinned-SHA lockfile, and
`scripts/start-worktree.sh` lays vendored roots down in every worktree.
`vendor/sources.ts:190-206` (the `date` entry) is the worked precedent for a
vendored-as-read-anchor-only source: `compareApi: false`, with a comment
explaining that the surface is C so `extract-ruby-api.rb` sees nothing.

**Pin `v3_3_11`.** `.github/workflows/ci.yml:1412,1685,1798` pin
`ruby-version: "3.3"`; the host toolchain is `ruby 3.3.11 (2026-03-26 revision
1f2d15125a)`; and `date.ts:1230-1231` writes its behavioural claim against that
exact build — "on ruby 3.3.11 `(Rational(1,2) * 12).class` is `Rational`".
Pinning elsewhere makes existing in-tree citations unverifiable. The `date` gem
stays at its own `v3.4.1` ref; interpreter and gem refs are independent.

`ruby/ruby` also mirrors the ruby/spec suite in-tree at `spec/ruby/`, so this
one source serves both the C read-anchor and the behavioural suite RFC
0129-ruby-compat's `ruby-spec-behavioural-enrollment` story needs. A separate
`ruby/spec` clone (which RFC 0089 planned) is not required.

Note the clone size: `ruby/ruby` is substantially larger than any currently
vendored source. If a full clone is unacceptable in CI, a partial/blobless
clone (`--filter=blob:none`) or a sparse checkout scoped to the C sources plus
`spec/ruby/core/` is the fallback — decide it in this story with a measurement,
not by guess.

## Acceptance criteria

- A `ruby` entry in `SOURCES` (`vendor/sources.ts`) pinned to ref `v3_3_11`,
  with `compareApi: false` and `compareTests: false`, and a comment recording
  WHY the pin is 3.3.11 (the three CI lines and the `date.ts` behavioural
  claim) and why compare is off (C surface, `extract-ruby-api.rb` extracts
  nothing) — the way the `date` entry does.
- `vendor/sources.lock.json` carries the resolved SHA for `v3_3_11`.
- `pnpm vendor:fetch` populates `vendor/ruby/`; `scripts/start-worktree.sh`
  lays it down in a fresh worktree alongside `vendor/rails/`.
- `vendor/sources.test.ts` and `vendor/fetch.test.ts` stay green; the new entry
  is covered by whatever per-source assertions those files already make.
- `vendor/README.md` states that `vendor/ruby/` is the MRI read-anchor, names
  the pin, and says it is never enrolled in `parity:api`.
- Clone cost measured and recorded in the PR body; if a filtered or sparse
  clone is used, `fetch.ts` carries a comment saying which paths are fetched
  and why.
- `pnpm parity:api` and `pnpm parity:test` deltas non-negative (this story adds
  no TS surface).
