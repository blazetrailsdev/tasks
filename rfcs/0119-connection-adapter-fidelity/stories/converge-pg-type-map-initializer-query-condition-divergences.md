---
title: "Converge TypeMapInitializer's query_conditions_for_* divergences: defensive quote-escaping and the WHERE 1=0 short-circuit"
status: draft
updated: 2026-08-26
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/connection-adapters/postgresql/oid/type-map-initializer.ts`
carries two deviations that are ratified in place by a `// Divergence:` comment
rather than tracked. Both sit in `query_conditions_for_*`, whose Rails bodies
are three lines each
(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/oid/type_map_initializer.rb:36-58`).
Surfaced in #7095, which converged the surrounding store typing and left these
alone as out of scope.

1. **Defensive quote-escaping Rails does not do** (`:62-66`):

   ```ts
   // Divergence: Rails interpolates type names unescaped (they're internal
   // keys, not user input). We single-quote-escape defensively since the
   // output is still SQL and the cost is negligible.
   const knownTypeNames = this.store.keys().map((key) => `'${String(key).replace(/'/g, "''")}'`);
   ```

   Rails (`type_map_initializer.rb:37`) is
   `known_type_names = @store.keys.map { |n| "'#{n}'" }` — no escaping. The
   comment's own reasoning concedes the values are internal keys, so the escape
   can never fire; it is belt-and-braces, which is a preference, not a language
   shortcoming.

2. **A `WHERE 1=0` short-circuit Rails does not have** (`:71-78`):

   ```ts
   // Divergence: Rails emits `t.typelem IN ()` for an empty OID set, which
   // is invalid SQL. We short-circuit to `WHERE 1=0` to return zero rows
   // instead of erroring.
   if (knownTypeOids.length === 0) return "WHERE\n  1=0\n";
   ```

   Rails (`type_map_initializer.rb:52-57`) interpolates the joined list
   unconditionally. This one is a real behavioural difference, not just extra
   work: on an empty store trails returns zero rows where Rails raises a syntax
   error. Converging it means deciding whether the empty-store case is
   reachable at all — `load_additional_types` is only called with a warm store,
   which is presumably why Rails never guards it.

Per CLAUDE.md, a `// Divergence:` comment is a burndown ledger entry, not
permission; neither of these is a TypeScript language shortcoming.

## Converged shape

1. Drop the escape: ``this.store.keys().map((key) => `'${key}'`)``, matching
   rb:37 exactly.
2. Drop the short-circuit and interpolate unconditionally, matching rb:52-57.
   Before doing so, confirm the empty-store path is genuinely unreachable from
   `loadAdditionalTypes` (as it is in Rails); if a trails-only caller CAN reach
   it with an empty store, that caller is the bug — fix it there rather than
   reinstating the guard here.

## Acceptance criteria

- [ ] `queryConditionsForKnownTypeNames` interpolates unescaped, as rb:37.
- [ ] `queryConditionsForArrayTypes` has no `1=0` arm and mirrors rb:52-57.
- [ ] Both `// Divergence:` comments are gone (converged, not reworded).
- [ ] If an empty-store caller exists, it is fixed at the caller with a note in
      the PR; otherwise state that the path is unreachable, as in Rails.
- [ ] PostgreSQL lane green.
