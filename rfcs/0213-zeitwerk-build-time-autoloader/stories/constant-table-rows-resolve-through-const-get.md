---
title: "Every constant table row resolves through constGet"
status: draft
updated: 2026-11-03
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: null
packages: []
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

`constGet` in `packages/ruby-compat/src/variable.ts:398` walks by segment and reads `generatedClass` per prefix, so `constGet(Object, "A::B")` raises when `A` has no seat or row, even with a row for `A::B` (seen writing the test in `classpath.trails.test.ts`, which needs a parent row). Rows live in `packages/*/src/constants*.generated.ts`. ruby-compat's core `constants.generated.ts` uses `classpaths.set` only, so it does not feed `generatedClass`. Ruby: `rb_path_to_class`, `vendor/ruby/v3.3.11/variable.c:432`.

## Acceptance criteria

- `parity:class-paths --check` reds on a table row `constGet(Object, path)` cannot resolve after the entry loads.
- Every existing row resolves through `constGet`, core classes included.
