---
title: "enum changed_attributes exposes name->old-value map"
status: done
updated: 2026-07-07
rfc: "0050-enum-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 41
pr: 4726
claim: "2026-07-07T04:01:32Z"
assignee: "enum-changed-attributes-old-value-hash"
blocked-by: null
closed-reason: null
---

## Context

Surfaced converging `enum.test.ts` to the canonical `Book` model (RFC 0050,
PR #4410 enum-canonical-book-gaps). Rails' `enum changed attributes` test
(`vendor/rails/activerecord/test/cases/enum_test.rb:209-217`) reads
`@book.changed_attributes[:status]` expecting the _old value_ (a name→old-value
map). trails' `changedAttributes` is a `string[]` of attribute names, not a
name→old-value map, so the test is `it.skip`-ped in
`packages/activerecord/src/enum.test.ts` ("enum changed attributes").

This is a broad ActiveModel::Dirty surface change (changedAttributes shape), not
enum-local — scope carefully and check downstream callers of `changedAttributes`.

## Acceptance criteria

- [ ] `changedAttributes` exposes a name→old-value map matching Rails
      `ActiveModel::Dirty#changed_attributes`.
- [ ] Un-skip `enum.test.ts` "enum changed attributes" (drop `it.skip` → `it`).
