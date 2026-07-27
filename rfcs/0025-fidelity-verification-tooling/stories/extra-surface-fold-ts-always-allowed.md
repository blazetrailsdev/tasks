---
title: "extra-surface: give TS_ALWAYS_ALLOWED reasoned, stale-checked entries"
status: draft
updated: 2026-07-25
rfc: "0025-fidelity-verification-tooling"
cluster: null
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

> Re-homed from RFC 0072 (api-compare parity burndown), which was pruned to
> ActiveRecord-scoped work. This story changes `scripts/api-compare/` tooling,
> not a package, so it belongs with the fidelity-verification tooling.

`extra-surface.ts` has two suppression mechanisms with different rigor. The
new reasoned allowlist (`extra-surface-allow.json`, PR #5317) is keyed by
`package + tsFile + name`, requires a non-empty `reason`, and fails the run on
stale entries. The older `TS_ALWAYS_ALLOWED` set (`extra-surface.ts:87`) is a
global bare-name list (`dup`, `freeze`, `catch`, `[Symbol.iterator]`, …) with
only a shared block comment: it suppresses a name in EVERY file, has no
per-entry justification, and nothing detects when an entry stops being needed.

The two overlap in purpose. Folding the language-protocol names into the
reasoned file (or giving `TS_ALWAYS_ALLOWED` its own reasoned, stale-checked
representation) makes every suppression auditable by the same rule.

Note the grain difference before porting: `TS_ALWAYS_ALLOWED` is file-agnostic,
so a naive migration would need one allowlist row per (file, name) pair that
currently benefits — decide whether to widen the allowlist schema with an
optional file-less/global form or to enumerate the pairs.

## Acceptance criteria

- `TS_ALWAYS_ALLOWED` entries carry a per-entry `reason` and are subject to the
  same stale detection as the reasoned allowlist (or a documented decision, at
  the call site, for why a given entry must stay global and uncheckable).
- `pnpm api:extra` novel/moved counts are unchanged by the migration — verify
  against a before/after `--json` run.
- Tests cover the migrated path in `extra-surface.test.ts`.

## Fidelity-first policy

Moving toward Rails fidelity is the stated goal of this (and every)
extra-surface story; the allow-set/allowlist is a **last resort**. Before
admitting or keeping any name in the allow-set, first make — or file as its own
story — the fidelity change that would make the entry unnecessary: converge the
TS surface onto the Rails name and Rails-layout file (relocate + rename),
delete the invention, or justify an `@internal` at the declaration site. Only
names that are faithful-but-unmappable (e.g. genuine Ruby file constants or
nested class names present in the matched Rails file) belong in the allow-set;
any other allowlisted entry must cite the filed fidelity story next to it.
