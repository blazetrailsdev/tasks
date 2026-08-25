---
title: "select-manager-set-ops-widened-param"
status: done
updated: 2026-08-14
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6538
claim: "2026-08-14T18:57:42Z"
assignee: "activemodel-define-attribute-method-code-generator"
blocked-by: null
closed-reason: null
---

## Context

`packages/arel/src/select-manager.ts` `intersect`, `except` (and `union`)
declare `other: SelectManager | SelectStatement` and therefore need a local:

```ts
intersect(other: SelectManager | SelectStatement): Intersect {
  const otherAst = other instanceof SelectManager ? other.ast : other;
  return new Intersect(this.ast, otherAst);
}
```

Rails (`vendor/rails/activerecord/lib/arel/select_manager.rb:209-215`) accepts a
manager only and has no local:

```ruby
def intersect(other)
  Nodes::Intersect.new ast, other.ast
end

def except(other)
  Nodes::Except.new ast, other.ast
end
alias :minus :except
```

The widened parameter is a trails addition; converging means narrowing it back
to `SelectManager` (checking no caller passes a bare `SelectStatement`) so the
body can be Rails' one-liner. Note `alias :minus :except` is also unported.

This is an a3, not a rename — surfaced by RFC 0096 wave 3
(`naming-burndown-3-arel-activemodel`), where it keeps 2 `naming`
call-argument rows standing.

## Acceptance criteria

- [ ] `intersect` and `except` take a `SelectManager` and read `other.ast`
      directly, per select_manager.rb:209-215; callers passing a
      `SelectStatement` are updated or the widening is justified at the call
      site.
- [ ] `minus` exists as the `except` alias, or its absence is filed separately.
- [ ] `pnpm parity:api:calls:args:report` shows the 2 `naming` rows retired,
      with no new `shape` rows.
