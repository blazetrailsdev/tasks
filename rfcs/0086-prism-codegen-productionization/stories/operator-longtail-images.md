---
title: "operator-longtail-images"
status: ready
updated: 2026-08-01
rfc: "0086-prism-codegen-productionization"
cluster: null
deps:
  - codegen-golden-output-snapshots
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Toward 100% node coverage (PR #5727 baseline: 89.6%, 107 decline sites).
Largest bucket: 40 CallNode + 19 CallOperatorWriteNode + 2
LocalVariableOperatorWriteNode markers — operator methods and compound
assignments without a JS image in scripts/prism-codegen/handlers/
expressions.ts (INFIX) and misc.ts (COMPOUND): `<=>` (add a `cmp` runtime
helper next to caseEq/range in runtime.ts), compound ops outside COMPOUND
(`<<=` as push-assign, `|=`/`&=` on arrays via helpers), `&:+`-style
operator sym-to-proc (`(a, b) => a + b` for INFIX ops), and multi-arg
index get/set via `idxGet`/`idxSet` helpers (currently declined as lossy).

## Acceptance criteria

- The operator buckets emit decided images or helpers; census markers for
  these kinds reach zero across the 10 targets.
- runtime.ts helpers implemented and unit-tested; 0 parse errors invariant
  holds; per-kind tests added.
