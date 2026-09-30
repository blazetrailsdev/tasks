---
title: "arel: port Visitor's identity-keyed dispatch cache and #visit's NoMethodError rescue arm"
status: ready
updated: 2026-09-30
rfc: "0172-arel-parity-100"
cluster: api-surface
packages: ["arel"]
deps: ["ruby-compat-hash-keys-by-identity-not-eql"]
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

Two arel gates carry their only arel residue in `packages/arel/src/visitors/visitor.ts`:

- **call-args (shape) baseline, 1 row** — `scripts/api-compare/call-mismatches-exclude/arel/visitors/visitor.json`,
  `dispatch_cache` → `new`. Rails builds
  `Hash.new { |hash, klass| hash[klass] = :"visit_#{(klass.name || "").gsub("::", "_")}" }.compare_by_identity`
  (`vendor/rails/v8.0.2/activerecord/lib/arel/visitors/visitor.rb:17`); the port constructs a bare `Map` and fills it
  by hand, because a JS `Map` takes no default block.
- **arm-throw mark, 1** — `scripts/api-compare/arm-throw-mark.json` `arel.byFile["visitors/visitor.ts"]`.
  `Visitor#visit` (`vendor/rails/v8.0.2/activerecord/lib/arel/visitors/visitor.rb:27`) is
  `send dispatch[object.class.name], object, collector` with a `rescue NoMethodError => e` arm that
  re-raises unless the method is missing, then walks `object.class.ancestors` and finally raises
  `TypeError, "Cannot visit #{object.class}"`. `pnpm parity:api:arms:report --package=arel
--direction=missing` shows `visitors/visitor.ts#visit -try -rescue -if -if -throw`.

ruby-compat's `Hash` (`packages/ruby-compat/src/hash.ts`, the `Map` subclass carrying Ruby's
`default` / `default_proc` seats) already expresses the default block; `compare_by_identity` is
`ruby-compat-hash-keys-by-identity-not-eql` (RFC 0154), which this story depends on. The `@missingRailsArgs` PERMANENT receipts arel
still carries (`grep -rn missingRailsArgs packages/arel/src`) are audited by
`arel-audit-permanent-receipts-against-claude-md`, not here.

## Acceptance criteria

- [ ] `dispatch_cache` is `new Hash(block)` from ruby-compat with `compareByIdentity()`, and the `visitor.json` args row is **deleted** (the shard file removed when empty).
- [ ] `visit` ports the rescue arm: the re-raise guard, the ancestor walk, and `TypeError` with Rails' message, raised where Rails raises it.
- [ ] `pnpm parity:api:arms:throws:tighten` narrows `arel.total` 1 → **0**.
- [ ] `pnpm parity:api:calls:args` green with arel's shape rows 1 → **0**.

## Verification

```bash
pnpm parity:api:calls:args && pnpm parity:api:arms:throws
pnpm vitest run packages/arel/src/visitors
```
