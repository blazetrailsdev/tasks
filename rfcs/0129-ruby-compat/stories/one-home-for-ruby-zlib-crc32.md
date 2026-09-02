---
title: "Zlib.crc32 is hand-rolled twice in two packages with no shared home"
status: ready
updated: 2026-09-02
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby's `Zlib.crc32` now has **two hand-rolled private copies** in trails, in two
packages, with no shared home:

- `packages/activerecord/src/migration.ts:93` — `function crc32(str: string)`,
  used at `migration.ts:1944` for the advisory-lock id, mirroring
  `activerecord/lib/active_record/migration.rb`'s
  `Zlib.crc32(db_name_hash)` arm.
- `packages/actionview/src/helpers/asset-url-helper.ts` — a second, identical
  bit-by-bit CRC-32 added by PR #7378 for `compute_asset_host`'s `%d` wildcard
  arm, `host % (Zlib.crc32(source) % 4)`
  (`actionview/lib/action_view/helpers/asset_url_helper.rb:295`, with the
  `require "zlib"` at `asset_url_helper.rb:3`).

Ruby has one `Zlib`. Both Rails files reach the same stdlib function, so trails
should too — a second copy was added only because there was nowhere to put it,
and a third will be added the next time a Rails body calls `Zlib.crc32`. Both
copies are module-private, so neither shows up in `parity:api:extra`; the
duplication is invisible to every gate.

Prior art: `zlib-seam-is-the-last-static-node-builtin` (RFC 0129) covers the
other half of the same gap — `packages/activesupport/src/gzip.ts:1`'s static
`node:zlib` import and the missing `zlib` adapter seam. That story is about the
compression primitives behind `ActiveSupport::Gzip`; this one is about `crc32`,
which needs no Node builtin at all (both copies are pure TS). Triage should
decide whether they land together — the answer to "where does `Zlib` live"
should be one answer, not two.

## Acceptance criteria

- `Zlib.crc32` has exactly one implementation, in the home RFC 0129 settles on
  (`packages/ruby-compat/src/zlib.ts` is the obvious candidate, spelled as the
  Ruby module so call sites read `Zlib.crc32(...)`).
- `migration.ts` and `asset-url-helper.ts` both call it; their private copies are
  deleted.
- A test pins the implementation against MRI for a handful of inputs — `ruby` is
  on PATH, so the expected values come from `ruby -rzlib -e 'puts Zlib.crc32(...)'`
  rather than from another JS implementation.
- Any new cross-package subpath registration this needs is complete (see the
  4-registration checklist for a new `@blazetrails/ruby-compat/*` entry point).
