---
title: "The Contexts module's state and methods live in context.ts, not contexts.ts"
status: done
updated: 2026-08-07
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6184
claim: "2026-08-07T17:13:47Z"
assignee: "fk-test-pair-columns-are-integer-not-bigint"
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

`pnpm parity:api:extra --package activerecord` reports four of them as novel surface on
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

**Unblocked 2026-08-07.** The previous attempt stopped because ESM had no
sanctioned deferral for Ruby's autoload and picking one was out of a single
story's scope. That decision now exists and is written down: CLAUDE.md,
"Call-time constant resolution (Ruby autoload → the zero-import slot)", with
`packages/activerecord/src/encryption/configurable-slot.ts` as a worked
instance in this exact cluster (its header documents the same
`EncryptingOnlyEncryptor extends Encryptor` TDZ this move hits). Apply that
shape to `EncryptingOnlyEncryptor` rather than re-deriving a justification —
and read the "do not add a third instance without reading that section" note in
`configurable-slot.ts` first.

## Acceptance criteria

- [ ] `withEncryptionContext`, `withoutEncryption`, `context`,
      `currentCustomContext`, `defaultContext` and `resetDefaultContext` are
      implemented in `encryption/contexts.ts`, not delegated to `context.ts`.
- [ ] `contextStack` / `_defaultContext` move with them.
- [ ] `encryption/context.ts` exports only what `context.rb` defines.
- [ ] `pnpm parity:api:extra --package activerecord` loses the four novel
      `encryption/context.ts` names; none of them is replaced by a
      `@noRailsEquivalent` tag.
- [ ] Encryption suites green on all three lanes.
