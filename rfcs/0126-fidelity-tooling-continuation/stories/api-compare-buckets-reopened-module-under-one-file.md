---
title: "parity:api buckets a reopened Ruby module's methods under one file"
status: claimed
updated: 2026-08-30
rfc: "0126-fidelity-tooling-continuation"
cluster: api-compare
deps: []
deps-rfc: []
est-loc: 120
priority: 4
pr: null
claim: "2026-08-30T13:30:13Z"
assignee: "api-compare-buckets-reopened-module-under-one-file"
blocked-by: null
closed-reason: null
---

## Context

`compare.ts` groups Ruby methods into per-file buckets by the **entity's**
`file` (`compare.ts:1462`, `item.info.file`), not by each method's own `file`
field — which the Ruby extractor does record correctly (`rails-api.json`
carries a per-method `file`). So when a Ruby module is opened in one file and
reopened in another, every one of its methods reports against the first file's
expected TS counterpart, and the second file never appears in the comparison at
all (inflating the `files N/N` figure).

Found while converging `activerecord-test-support` (PR #5517):
`module ARTest` opens in `vendor/rails/activerecord/test/support/config.rb` and
is reopened in `connection.rb`. All seven ARTest methods bucketed under
`config.rb` → expected `config.ts`, so `connection_name` /
`test_configuration_hashes` / `connect` reported MISSING despite being ported
and exported in `packages/activerecord/src/support/connection.ts`, and
`connection.rb` never showed up as a compared file.

PR #5517 papered over this with a `SCOPED_SKIP_GROUPS` entry
(`scripts/api-compare/conventions.ts`, the `config.rb` group) whose reason
documents the artifact at length. Three of that group's seven names
(`connection_name`, `test_configuration_hashes`, `connect`) are suppressed
**only** because of this bucketing — they are real, matching ports declared in
connection.rb. Fixing the bucketing lets those three be deleted from the skip
group.

Corrected 2026-08-30 (PR #7238): this paragraph used to name `expand_config` as
a fourth bucketing-only name. It is not one. `expand_config` is declared in
config.rb itself (config.rb:26, under that file's `private` at :13), so it
buckets under config.rb however the reopening split is spelled; what makes it
miss is the import cycle below, not the bucketing. It stays in the skip group
alongside the no-counterpart trio (`config`, `config_file`, `read_config`),
whose reason is narrowed to those two populations.

Note the move that would "fix" it at the source is not available: relocating
`expandConfig` into `config.ts` would create an import cycle (`connection.ts`
already imports six symbols from `config.ts` at `connection.ts:35-45`, while
`config.ts` imports nothing but activesupport), and `expandConfig` is typed on
`NamedConnection` (`connection.ts:102`) and `ARUNIT_ENTRY_NAMES` (`:120`).

Likely other affected sites: any Ruby module reopened across files. Worth a
sweep of `rails-api.json` for entities whose methods carry a `file` different
from the entity's own, to size the blast radius before changing the grouping.

## Acceptance criteria

- Per-file buckets key off each method's own `file` when the extractor records
  one, falling back to the entity's file.
- `connection.rb` appears as a compared Ruby file for
  `activerecord-test-support`, paired with `support/connection.ts`, and its
  three public methods match there.
- The three bucketing-only names (`connection_name`,
  `test_configuration_hashes`, `connect`) are removed from the `config.rb`
  `SCOPED_SKIP_GROUPS` entry and its reason is narrowed to what remains —
  the no-counterpart trio plus `expand_config`, which is not a bucketing
  artifact (see the correction above); `docs/ruby-ts-conventions.md`
  regenerated.
- No package's method total regresses — check the full `parity:api` summary
  before/after, since re-bucketing moves methods between files repo-wide.

## Path refresh — 2026-08-17

Citations in this body predate the RFC 0092 `parity:*` consolidation, which moved
several modules out of `scripts/api-compare/` into `scripts/parity/`. Verified
current locations:

- `scripts/api-compare/conventions.ts` -> `scripts/parity/conventions.ts`

## Re-verified 2026-08-17 (ready sweep)

Behaviour unchanged. Note `scripts/api-compare/conventions.ts` moved to
`scripts/parity/conventions.ts` (RFC 0092); `compare.ts` stayed put.
