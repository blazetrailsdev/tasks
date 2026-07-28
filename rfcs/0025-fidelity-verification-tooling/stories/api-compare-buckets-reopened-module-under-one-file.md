---
title: "api:compare buckets a reopened Ruby module's methods under one file"
status: draft
updated: 2026-07-28
rfc: "0025-fidelity-verification-tooling"
cluster: api-compare
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
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
documents the artifact at length. Four of that group's seven names
(`connection_name`, `test_configuration_hashes`, `connect`, `expand_config`)
are suppressed **only** because of this bucketing — they are real, matching
ports. Fixing the bucketing lets those four be deleted from the skip group,
leaving it to cover just the genuine no-counterpart trio (`config`,
`config_file`, `read_config`).

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
- The four bucketing-only names are removed from the `config.rb`
  `SCOPED_SKIP_GROUPS` entry and its reason is trimmed to the remaining trio;
  `docs/ruby-ts-conventions.md` regenerated.
- No package's method total regresses — check the full `api:compare` summary
  before/after, since re-bucketing moves methods between files repo-wide.
