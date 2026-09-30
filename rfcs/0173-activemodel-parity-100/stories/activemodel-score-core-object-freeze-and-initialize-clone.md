---
title: "activemodel: score and port freeze / initialize_clone, hidden by SKIP_GROUPS[0]"
status: ready
updated: 2026-09-30
rfc: "0173-activemodel-parity-100"
cluster: skips
packages: ["activemodel"]
deps:
  [
    "parity-100-rehome-postponed-rfc-dependencies",
    "arel-score-core-object-names-nil-and-case-then",
    "ruby-object-clone-dup-has-no-settled-trails-spelling",
  ]
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`SKIP_GROUPS[0]` (not marked PERMANENT) hides four activemodel definitions from `parity:api`:

- `AttributeSet#freeze` (`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_set.rb:68`) — freezes `@attributes` and returns `super`.
- `AttributeSet#initialize_clone` (`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_set.rb:82`).
- `Attributes#freeze` (`vendor/rails/v8.0.2/activemodel/lib/active_model/attributes.rb:150`) — `@attributes = @attributes.clone.freeze; super`.
- `Validations#freeze` (`vendor/rails/v8.0.2/activemodel/lib/active_model/validations.rb:372`) — `errors`, then `context_for_validation`, then `super`.

`Object.freeze` gives JS the capability; ruby-compat carries `frozen?` bookkeeping (ruby-compat's
`Hash` has a `#frozen` seat). `ruby-object-clone-dup-has-no-settled-trails-spelling` (RFC 0023) is the
settled-spelling question for `clone`/`dup`; this story depends on it rather than inventing one.

## Acceptance criteria

- [ ] `freeze` and `initialize_clone` are removed from `SKIP_GROUPS[0]` for scoring (they stay in the call-mapping exclusions only if the call gate would red on unrelated packages — say which in the PR).
- [ ] Each of the four is ported in its mirroring file with Rails' body; `record.freeze()` on an ActiveModel object freezes the attribute set as Rails does, with a test.
- [ ] `pnpm parity:api` activemodel `global skip` 13 → 9 (the lifecycle hooks and `method_missing` rows CLAUDE.md ratifies remain).

## Verification

```bash
pnpm parity:api && pnpm parity:api:pins && pnpm vitest run scripts/parity/conventions.test.ts
```
