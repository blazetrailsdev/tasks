---
title: "converge-invented-association-scope-and-key-helpers"
status: claimed
updated: 2026-09-24
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 9
pr: null
claim: "2026-09-24T13:40:32Z"
assignee: "adapter-class-sync-retires-with-eager-adapter-resolution"
blocked-by: null
closed-reason: null
---

## Context

Split out of `relabel-invented-association-helper-permanent-receipts`, which
relabelled these names' `PERMANENT` receipts to `CONVERGEABLE` pointing here.
All are trails inventions Rails inlines or does not have (CLAUDE.md § No extra
abstraction):

- `associations/association-scope.ts` `invokeScopeLambda` — dispatches on
  `fn.length` at every call. Rails normalizes the arity ONCE, at build time:
  `Builder::Association.build_scope`
  (`activerecord/lib/active_record/associations/builder/association.rb:53-59`)
  wraps a zero-arity scope in `proc { instance_exec(&scope) }`, and every
  reader is then a plain `relation.instance_exec(owner, &scope) || relation`
  (`association_scope.rb:169-172`, `reflection.rb:448-450`).
- `associations.ts` `applyAssociationScope` — wraps that `instance_exec || rel`
  with a `reflectionScope` identity skip; its callers are
  `associations/singular-association.ts` and
  `associations/has-many-association.ts` (two sites). Rails has no such helper:
  each caller goes through `AssociationScope.scope` / `scope_for`.
- `associations/collection-association.ts` `isThenable` — the sync/async
  dual-return probe the collection writers branch on. No ratified CLAUDE.md
  section covers these dual returns; converge them onto the awaitable Rails
  bodies (or the Relation thenable machinery) and delete the probe.
- `associations/key-normalization.ts` `normalizeAssociationKey` — maps a
  `bigint` key to a `number`/`string` so it can key a JS `Map` in
  `disable-joins-association-relation.ts` (`:13`, `:18`, `:271`). Rails keys a
  Ruby Hash by Integer (`disable_joins_association_relation.rb`); use the
  ruby-compat Hash (which keys through `rbHash`/`rbEql`) instead.

## Acceptance criteria

- [ ] Zero-arity scopes are wrapped at build time as `build_scope` does, and
      `invokeScopeLambda` is deleted.
- [ ] `applyAssociationScope` is inlined into its callers or replaced by the
      Rails reader it stands for.
- [ ] `isThenable` is deleted.
- [ ] `normalizeAssociationKey` and `key-normalization.ts` are deleted.
- [ ] `pnpm parity:api:extra:gate` stays green; no name gains a new receipt.
