---
title: "The Contexts module's state and methods live in context.ts, not contexts.ts"
status: ready
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`contexts.rb` owns the whole `Contexts` module: `default_context` and
`custom_contexts` (contexts.rb:16-19), `with_encryption_context` (33-43),
`without_encryption` (49-51), `protecting_encrypted_data` (57-59), `context`
(62-64), `current_custom_context` (66-68) and `reset_default_context` (70-72).
`context.rb` holds only the `Context` class.

In trails that state and all but one of those methods live in
`encryption/context.ts` as free functions — `withEncryptionContext`,
`withoutEncryption`, `getEncryptionContext`, `getDefaultContext`,
`setDefaultContext`, `getCurrentCustomContext`, `resetDefaultContext`, plus the
module-scope `contextStack` and `_defaultContext` — and `encryption/contexts.ts`
is a thin `Contexts` class delegating to them.

`pnpm api:extra --package activerecord` reports four of them as novel surface on
`context.ts` (`getCurrentCustomContext`, `getDefaultContext`,
`getEncryptionContext`, `resetDefaultContext`): they have no counterpart in
`context.rb`, because their counterpart is in `contexts.rb`.

PR #6123 moved `protectingEncryptedData` into `contexts.ts`, where contexts.rb
has it, as part of breaking the eval-time cycle. The rest did not move — that
was out of that story's scope.

## Converged shape

The `Contexts` module's state and methods live in `encryption/contexts.ts`, at
the Rails names, and `encryption/context.ts` holds only the `Context` class as
context.rb does. The four novel names on `context.ts` disappear rather than
being tagged.

Watch the eval order while moving: `contexts.ts` imports
`EncryptingOnlyEncryptor`, whose `extends Encryptor` reaches `configurable.ts`,
so anything that moves into `contexts.ts` must not be read at module-eval time
by `configurable.ts` or `context.ts`. See
[[configurable-reads-the-context-through-contexts]], which is the other half of
this graph.

## Acceptance criteria

- [ ] `withEncryptionContext`, `withoutEncryption`, `context`,
      `currentCustomContext`, `defaultContext` and `resetDefaultContext` are
      implemented in `encryption/contexts.ts`, not delegated to `context.ts`.
- [ ] `contextStack` / `_defaultContext` move with them.
- [ ] `encryption/context.ts` exports only what `context.rb` defines.
- [ ] `pnpm api:extra --package activerecord` loses the four novel
      `encryption/context.ts` names; none of them is replaced by a
      `@noRailsEquivalent` tag.
- [ ] Encryption suites green on all three lanes.
