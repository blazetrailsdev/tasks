---
title: "activerecord: composed-of-class-name-is-a-string-not-a-constructor"
status: in-progress
updated: 2026-10-09
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#8715
claim: "2026-10-09T16:09:36Z"
assignee: "activerecord-converge-invented-control-flow-arms-schema-dumper"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/aggregations.ts` `composedOf` passes Rails' `options` to
`Reflection.create` through a ternary Rails does not have: when `options.className` is a
constructor it rewrites the hash to `{ ...options, className: options.className.name, anonymousClass: options.className }`.
Rails' `composed_of` (`vendor/rails/v8.0.2/activerecord/lib/active_record/aggregations.rb:225-245`)
hands `options` to `ActiveRecord::Reflection.create(:composed_of, part_id, nil, options, self)`
unchanged; `class_name` is a String. The arm is reported by
`pnpm parity:api:arms:report --package=activerecord --direction=invented` as
`aggregations.ts#composedOf +if` and carries `@inventedArm if`.

## Acceptance criteria

- [ ] `composedOf` passes `options` to `create` unchanged, as `aggregations.rb:243` does.
- [ ] `ComposedOfOptions.className` is a string; tests that pass a constructor name the class instead.
- [ ] The `@inventedArm if` receipt on `composedOf` is deleted and the invented report shows no row for it.
