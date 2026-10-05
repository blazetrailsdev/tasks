---
title: "activerecord: Preloader::Branch#build_children is two flat_maps over Kernel#Array"
status: ready
updated: 2026-10-05
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `preloader/branch.ts` in trails#8483. `Preloader::Branch#build_children` (`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/preloader/branch.rb:126-138`) is two nested `flat_map`s with no branch:

```ruby
def build_children(children)
  Array.wrap(children).flat_map { |association|
    Array(association).flat_map { |parent, child|
      Branch.new(parent: self, association: parent, children: child, associate_by_default: associate_by_default, scope: scope)
    }
  }
end
```

`Branch#buildChildren` (`packages/activerecord/src/associations/preloader/branch.ts`) instead takes three `if`s: `assoc == null` returns `[]`, an Array recurses into `buildChildren`, and a plain object maps its keys. The arms report does not file a row for it, so nothing tracks it.

The three arms stand in for two things Ruby does implicitly: `Kernel#Array` turning a Hash into `[key, value]` pairs (and `nil` into `[]`), and the block's `|parent, child|` destructuring an Array element while leaving a Symbol whole. activesupport's `kernelArray` returns `[obj]` for a plain object, so the port cannot call it here. The recursion is also wider than Rails: a nested array such as `[[:a, { b: :c }]]` builds branches in trails, where Rails passes the Hash as `parent` and `Branch#initialize` raises `ArgumentError` (`branch.rb:12-18`).

## Acceptance criteria

- [ ] `buildChildren` is `wrap(children).flatMap((association) => Array(association).flatMap(([parent, child]) => new Branch(...)))` with no `if`, over a `Kernel#Array` port that answers pairs for a Hash-shaped argument (MRI `rb_Array`, `vendor/ruby/v3.3.11/object.c`).
- [ ] The block-argument destructure does not split a String association name into characters.
- [ ] A nested array holding a Hash raises the `ArgumentError` Rails raises, with a test.

## Verification

```bash
pnpm vitest run packages/activerecord/src/associations/preloader packages/activerecord/src/associations/eager.test.ts && pnpm parity:api:calls
```
