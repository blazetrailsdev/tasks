---
title: "arity-rows-surfaced-by-file-scoped-candidates"
status: draft
updated: 2026-11-16
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`arity-check-global-name-pool-credits-unrelated-signatures` scoped the arity
check (`arityCandidates`, `scripts/api-compare/arity.ts`) to the matched TS
file's own signatures. Twenty-five pairs that the package-wide pool used to
credit through an unrelated same-named signature now report. Each one is a
real arity deviation in the port:

- **A threaded `superFn` parameter (19).** These mixin bodies take the next
  `super` as an argument where Rails calls `super`. RFC 0197 replaces that
  with `rbCallSuper` or an inlined body.
  - `attribute-methods/dirty.ts`: `_touchRow`, `_updateRecord`, `_createRecord` (`attribute_methods/dirty.rb`)
  - `callbacks.ts#destroy`, `transactions.ts#destroy`
  - `counter-cache.ts`: `_createRecord`, `destroyRow`
  - `encryption/encryptable-record.ts#_createRecord`
  - `locking/optimistic.ts`: `_createRecord`, `_touchRow`, `_updateRow`, `destroyRow`, `_queryConstraintsHash`, `updateCounters`, `hookAttributeType`
  - `timestamp.ts`: `_createRecord`, `_updateRecord`
  - `validations.ts`: `save`, `saveBang`
- **Other (6).**
  - `connection-pool/queue.ts#isAny(queue)` against `queue.rb` `any?()`
  - `relation/query-attribute.ts` constructor `(name, value, type)` against a forwarding `initialize(...)`
  - activesupport `core-ext/array/extract.ts#extractBang(array, predicate)` against `extract!` with an implicit block
  - actionpack `arguments.ts` constructor `(errinfo)`. Root CLAUDE.md "`$!` is passed explicitly" may already settle this one, in which case it closes as a comparer fix.
  - actionmailer `base.ts#params(value)` against `params()`
  - zeitwerk `loader/callbacks.ts#onFileAutoloaded(file, exports)` against `on_file_autoloaded(file)`

`pnpm parity:api --arity` lists them all (`output/arity-mismatches.json`).

## Acceptance criteria

- [ ] Each `superFn` row is converged under RFC 0197: `rbCallSuper`, or the module body inlined at its includers.
- [ ] Each of the other six is converged to the Rails arity. If the comparer is shown to be wrong for a row, fix the comparer in `scripts/api-compare/arity.ts` instead.
- [ ] `pnpm parity:api --arity` reports none of these 25 pairs.
