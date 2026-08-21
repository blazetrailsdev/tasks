---
title: "Retire the non-Q duplicate aliases of the AR Q-spelled predicates (isConnected, isReadonlyAttribute)"
status: in-progress
updated: 2026-08-21
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: 6819
claim: "2026-08-21T13:50:33Z"
assignee: "retire-collection-proxy-append-bang-and-wire-inverse-target"
blocked-by: null
closed-reason: null
---

# Retire the non-Q duplicate aliases of the AR Q-spelled predicates

## Context

Surfaced while landing PR #6728 (`credit-or-rename-the-q-suffixed-predicate-spellings`),
which made `Q` the sanctioned TS rendering of a Ruby `?` predicate in
`scripts/parity/conventions.ts`. That decision settles the spelling — which
means the _second_ spelling each of these members also exports is now plain
duplicate surface with no Rails counterpart.

Rails defines each of these exactly once:

- `connected?` — `activerecord/lib/active_record/connection_handling.rb:351`
  (one `def`). trails exports `isConnectedQ` at
  `packages/activerecord/src/connection-handling.ts:460` **and** re-exports it
  under a second name on the next line:
  `export const isConnected = isConnectedQ;` (connection-handling.ts:468).
- `readonly_attribute?(name)` —
  `activerecord/lib/active_record/readonly_attributes.rb:43` (one `def`).
  trails exports `readonlyAttributeQ` at
  `packages/activerecord/src/readonly-attributes.ts:~176` and then puts BOTH
  names on the mixed-in `ClassMethods` object
  (`readonly-attributes.ts:188-190`):

      export const ClassMethods = {
        attrReadonly,
        readonlyAttributeQ,
        isReadonlyAttribute: readonlyAttributeQ,
      };

`retire-logger-enabled-predicate-aliases` (0098, done) is the settled
precedent for this exact shape on the ActiveSupport side; this is the
ActiveRecord tail of it.

Note the two are not symmetric: `isConnected` is a module-level `export const`,
so its callers import it by name, whereas `isReadonlyAttribute` is only a key
on the `ClassMethods` mixin object, so its callers are `SomeModel.isReadonlyAttribute(...)`
call sites. Sweep each accordingly.

## Converged shape

One export per Rails `def`, at the `Q` spelling the conventions table now
produces:

- delete `export const isConnected = isConnectedQ;` and sweep its call sites
  onto `isConnectedQ`;
- delete the `isReadonlyAttribute: readonlyAttributeQ` key and sweep its call
  sites onto `readonlyAttributeQ`.

Both names are credited by `parity:api` today, so the sweep cannot lose
coverage — it only removes the duplicate.

## Acceptance criteria

- [ ] `isConnected` and `isReadonlyAttribute` no longer exist as separate
      names; every call site spells the `Q` form.
- [ ] `pnpm parity:api` delta non-negative — `connected?` and
      `readonly_attribute?` stay credited via the `Q` candidate.
- [ ] `pnpm parity:api:extra --package activerecord` novel/moved count drops (or
      is unchanged), never rises.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green; no new
      baseline row.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
