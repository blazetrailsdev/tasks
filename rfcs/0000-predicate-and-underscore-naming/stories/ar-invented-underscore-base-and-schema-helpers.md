---
title: "Converge invented `_` helpers on Base, inheritance and model schema"
status: draft
updated: 2026-10-26
rfc: "0000-predicate-and-underscore-naming"
cluster: ar-underscore-burndown
packages: ["activerecord"]
deps: ["naming-shape-merge-base-gate"]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The audit found these sites:

- `packages/activerecord/src/base.ts:560-568` (`_buildPkWhere`, `_buildPkWhereNode`, `_buildQueryConstraintsWhereNode`; Rails inlines these through `persistence.rb` `_query_constraints_hash`) and `base.ts:2485` (`_arBaseUnscopedWire`).
- `base.ts:857-859` (`_suppressAbstractCheck` / `_suppressStiNewDispatch`, ratified in CLAUDE.md § "A record is built with `new Klass` only", so they get receipts).
- `inheritance.ts:97,134,186` (`_computedBaseClass`, `__resetPrimaryAbstractClass`), `model-schema.ts:444` (`_schemaLoadPromise`), `attribute-methods.ts:230` (`_dangerousMethodsCache`) and `marshalling.ts:55,119` (`_marshalDump71`).

Names owned by `table-name-and-primary-key-are-declared-through-underscore-statics` (RFC 0189) are out of scope here.

## Acceptance criteria

- [ ] Each name is inlined into its Rails method, TS-private, or receipted, with the ratified flags receipted against their CLAUDE.md section.
- [ ] `invented` reaches 0 in these files.
