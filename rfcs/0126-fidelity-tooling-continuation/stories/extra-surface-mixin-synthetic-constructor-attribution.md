---
title: "extra-surface: mixin pseudo-module synthetic constructor entry escapes declaredIn filtering"
status: claimed
updated: 2026-08-31
rfc: "0126-fidelity-tooling-continuation"
cluster: null
deps: []
deps-rfc: []
est-loc: 25
priority: 5
pr: null
claim: "2026-08-31T19:32:59Z"
assignee: "extra-surface-mixin-synthetic-constructor-attribution"
blocked-by: null
closed-reason: null
---

## Context

> Re-homed from RFC 0072 (api-compare parity burndown), which was pruned to
> ActiveRecord-scoped work. This story changes `scripts/api-compare/` tooling,
> not a package, so it belongs with the fidelity-verification tooling.

Raised in review of PR #5336 (merged), which stopped `extra-surface.ts` from
attributing a `<file>:<fn>__mixin` pseudo-module's borrowed host surface to the
file declaring the mixin function.

`scripts/api-compare/extract-ts-api.ts` harvests each property of the returned
constructor's instance type and tags it with `declaredIn` when its declaration
lives in another file; `collectTsFileNames`
(`scripts/api-compare/extra-surface.ts:412`) then skips those. One member is
not covered: the synthetic `constructor` entry the extractor appends after the
property loop. It is built from the mixin FUNCTION's position, so it always
carries `file: relPath` and never a `declaredIn` — even when the constructor it
stands for belongs to a class declared in a different file.

Pre-existing behavior, unchanged by #5336 and explicitly left alone there
rather than opportunistically widening a fix PR. `constructor` is also absent
from `TS_ALWAYS_ALLOWED` (`scripts/api-compare/extra-surface.ts:87`), so it can
still land as extra surface on a file that declares no constructor.

Low impact — one name per mixin-declaring file, and only 6 activerecord files
declare `__mixin` pseudo-modules — but it is the one member the #5336
mechanism does not sharpen.

## Acceptance criteria

- Decide and implement one of: (a) tag the synthetic `constructor` entry with
  `declaredIn` derived from the returned class's own declaration site, so the
  existing `collectTsFileNames` filter covers it; or (b) add `constructor` to
  `TS_ALWAYS_ALLOWED` as a language-level name with no Rails counterpart, with
  the reasoning stated at the entry (the set already carries `dup`, `freeze`,
  `[Symbol.iterator]`, … on exactly that rationale).
- Prefer (a) if the constructor's declaring class is reachable from the
  construct signature; it keeps a genuinely in-file constructor counted.
- Extend the `__mixin` tests in `scripts/api-compare/extra-surface.test.ts` —
  the fixture there already builds a two-file program and can assert the
  `constructor` entry directly.
- Record before/after `pnpm parity:api:extra --package activerecord` totals; expect a
  change of at most ~6 extras.

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

## Re-verified 2026-08-17 (ready sweep)

Citations spot-checked against the current tree and still resolve; no path or
mechanism in this body has been retired. Carried forward unchanged.

General note from the sweep, applies to every `scripts/api-compare/` story: RFC 0092
moved `conventions.ts`, `types.ts`, `shared-cache.ts` and `write-json-manifest.ts`
to `scripts/parity/`, and RFC 0084 folded `call-mismatches-wide-exclude/` and
`lint-call-mismatches-wide.ts` into the single `call-mismatches-exclude/` tree.
Re-check any such reference before starting.
