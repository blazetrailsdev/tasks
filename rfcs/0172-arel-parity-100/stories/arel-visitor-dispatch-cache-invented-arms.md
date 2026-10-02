---
title: "arel: Visitor.dispatch_cache has three arms Rails does not"
status: in-progress
updated: 2026-10-02
rfc: "0172-arel-parity-100"
cluster: arms
packages: ["arel"]
deps: ["core-classes-have-no-class-object-visitor-keys-by-name"]
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8424
claim: "2026-10-02T21:38:14Z"
assignee: "arel-visitor-dispatch-cache-invented-arms"
blocked-by: null
closed-reason: null
---

## Context

Left over from `arel-converge-invented-control-flow-arms`: `pnpm parity:api:arms:report --package=arel` still lists `visitors/visitor.ts#dispatchCache` at `+if +if +if`.

Rails (`vendor/rails/v8.0.2/activerecord/lib/arel/visitors/visitor.rb:17-21`):

```ruby
def self.dispatch_cache
  @dispatch_cache ||= Hash.new do |hash, klass|
    hash[klass] = :"visit_#{(klass.name || "").gsub("::", "_")}"
  end.compare_by_identity
end
```

`packages/arel/src/visitors/visitor.ts#dispatchCache` has three arms Rails does not:

1. `if (!Object.prototype.hasOwnProperty.call(this, "_dispatchCache"))` where Rails has `||=` on a class-level ivar. A static field read walks the prototype chain to the superclass's cache, so the memo needs an own-property test; the arm report reads Rails' `||=` as `or`, not `if`.
2. `typeof klass === "string" ? klass : rbModName(klass)` — the `Klass = NodeCtor | string` key. Owned by `core-classes-have-no-class-object-visitor-keys-by-name` (RFC 0154).
3. A `path === ""` conditional choosing `"visit_"` over the `visit` + path name. trails' method names are camelCase (`visitArelNodesNot`), so the `_` separator is dropped, but an anonymous class must still answer a name no method has: a bare `"visit"` would dispatch to `Visitor#visit` itself and recurse.

## Acceptance criteria

- [ ] The memo is spelled as a short-circuit (`||=` / `??=` over an own-property slot), not an `if`.
- [ ] The dispatch name is derived by one expression for a named and an anonymous class alike.
- [ ] Arm 2 leaves with `core-classes-have-no-class-object-visitor-keys-by-name`.
- [ ] `pnpm parity:api:arms:report --package=arel` no longer lists `visitors/visitor.ts#dispatchCache`.
