---
title: "Make CollectionAssociation#callback/callbacks_for instance calls, not receiver-as-first-arg free functions"
status: done
updated: 2026-08-12
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6425
claim: "2026-08-12T16:36:52Z"
assignee: "pg-cancel-block-half-has-no-regression"
blocked-by: null
closed-reason: null
---

## Context

`replace_on_target` in
`packages/activerecord/src/associations/collection-association.ts` calls the
module-level `callback(assoc, "beforeAdd", record)` /
`callback(assoc, "afterAdd", record)`, where Rails makes an instance call
`callback(:before_add, record)` /`callback(:after_add, record)`
(`vendor/rails/activerecord/lib/active_record/associations/collection_association.rb:463`
and `:485`). The TS `callback` is a free function whose first parameter is the
receiver, so `parity:api:calls:args` reads `ref:assoc` as an extra leading
argument.

PR #6417 added two `kind: "args"` baseline rows for this in
`scripts/api-compare/call-mismatches-exclude/activerecord/associations/collection-association.json`
(`rubyName: replace_on_target`, `call: callback`). The calls predate that PR —
they only became visible when the five-function `replaceOnTarget` split
collapsed into one method the extractor can match to `replace_on_target`. A
sibling row for `callback → callbacks_for` (`rubyArgs: ["ref:method"]`) is
already in the same shard, and `collection-proxy.ts` spells the same shape
through `assocCallback(this._callbackHost, ...)`.

`callback` is private in Rails (`collection_association.rb:492`) and
`callbacks_for` is its lookup half (`:498`); both are instance methods on the
association. The converged shape is a method on `CollectionAssociation` rather
than a free function taking the receiver, per CLAUDE.md's module-mixin idiom
(`this`-typed functions assigned to the class) — which keeps the file layout and
drops the synthetic leading argument.

## Acceptance criteria

1. `callback` (and its `callbacks_for` half) are reached as instance calls on
   the association, not as free functions taking the receiver as argument 1.
2. The three `kind: "args"` rows in
   `call-mismatches-exclude/activerecord/associations/collection-association.json`
   whose `call` is `callback` / `callbacks_for` are DELETED (only-shrink; delete
   by hand, no `--write` reseed).
3. `pnpm parity:api:calls`, `pnpm parity:api:calls:args` and
   `pnpm parity:api:extra --package activerecord` stay clean.
