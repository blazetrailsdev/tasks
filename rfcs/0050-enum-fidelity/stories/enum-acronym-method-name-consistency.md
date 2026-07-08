---
title: "Derive enum method names from one shared helper so acronym labels match across conflict-detection and generation"
status: in-progress
updated: 2026-07-08
rfc: "0050-enum-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 50
priority: 2
pr: 4779
claim: "2026-07-08T10:42:22Z"
assignee: "enum-acronym-method-name-consistency"
blocked-by: null
closed-reason: null
---

## Context

`_enum` computes enum method names inconsistently for acronym-containing
labels. The pre-generation conflict-detection pass
(`packages/activerecord/src/enum.ts` ~line 550) derives the predicate name as
`is${camelize(methodName(n))}` (i.e. `camelize(x, /*upper*/true)`), while the
generation path — `EnumMethods.defineEnumMethods` (enum.ts ~325) and the
`enumMethodNames` bookkeeping (enum.ts ~675) — derive it as
`is${cap(toCamel(methodName(n)))}` = `is${cap(camelize(x, false))}`.

`camelize(x, true)` and `cap(camelize(x, false))` are identical for
non-acronym labels but diverge on acronyms (per
`packages/activesupport/src/inflector.ts:35-67`, only the first-segment
handling differs — acronym expansion vs. lowercase). So for an enum label like
`api_key` the conflict pass would check/record `isAPIKey` while generation
defines `isApiKey`. Result: (a) the method actually defined may differ from the
name recorded in `enumMethodNames`, weakening cross-enum "already defined by
another enum" detection, and (b) the pass's `definedNames` self-check keys off
a name that isn't the one generated.

Introduced/observed while routing generation through `defineEnumMethods` in
PR 4697: that change made the `fullName` predicate use `cap()` (the friendly
path already did), broadening a pre-existing partial inconsistency. No enum
test exercises acronym labels, so it's currently latent.

## Acceptance criteria

- The conflict-detection pass and the generator derive predicate / bang /
  scope / `not*` names from a single shared helper, so acronym labels produce
  identical names on both paths.
- A test with an acronym-containing enum label (e.g. `api_key`) asserts the
  generated predicate/scope name matches what conflict detection records
  (add to `enum.test.ts` or a `*.trails.test.ts` sibling if no Rails test
  covers it — Rails uses snake_case so the acronym surface is trails-specific).
- `api:compare` stays green for `enum.rb`; existing `enum.test.ts` unchanged.
