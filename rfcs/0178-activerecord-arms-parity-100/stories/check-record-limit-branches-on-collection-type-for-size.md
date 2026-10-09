---
title: "activerecord: check_record_limit! branches on the collection type to read size"
status: in-progress
updated: 2026-10-09
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: trails#8721
claim: "2026-10-09T18:39:41Z"
assignee: "attribute-methods-class-attribute-names-memo-and-cold-cache-arms"
blocked-by: null
closed-reason: null
---

## Context

Seen while working trails#8713. `pnpm parity:api:arms:report --package=activerecord --direction=invented`
still lists `activerecord/nested-attributes.ts#checkRecordLimitBang` with `+if`.

Rails' `check_record_limit!`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/nested_attributes.rb:553-570`) reads
`attributes_collection.size` twice, once in the comparison and once in the message. The port in
`packages/activerecord/src/nested-attributes.ts` computes a local first:

```ts
const size = Array.isArray(attributesCollection)
  ? attributesCollection.length
  : Object.keys(attributesCollection).length;
```

The ternary is the invented arm. `size` on an Array or a Hash is one call in Ruby.

## Acceptance criteria

- [ ] `checkRecordLimitBang` reads the size through one ruby-compat / ActiveSupport `size` call that
      answers both an array and a hash, with no branch on the collection's type, and no `size` local.
- [ ] The invented-direction arms report shows no row for `checkRecordLimitBang`.
- [ ] `nested-attributes.test.ts` limit cases green.
