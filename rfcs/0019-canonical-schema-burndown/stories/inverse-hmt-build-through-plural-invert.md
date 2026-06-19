---
title: "inverse-of: belongs_to finds has_many through plural inversion (Book/Subscriber)"
status: ready
updated: 2026-06-19
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`inverse-associations.test.ts > AutomaticInverseFindingTests > "belongs to
should find inverse has many automatically"` is still `it.skip`. Rails
(`inverse_associations_test.rb:203`) creates a `Book`, builds a `Subscriber`
through `book.subscribers.new`, saves it, and asserts `book.reload.subscribers`
round-trips. Needs `Subscription.automaticallyInvertPluralAssociations = true`
(Rails `models/subscription.rb`) plus has_many-:through build/insert on the
Book/Subscriber/Subscription canonical models.

- trails: `packages/activerecord/src/associations/inverse-associations.test.ts`
- Rails: `activerecord/test/cases/associations/inverse_associations_test.rb:203`

## Acceptance criteria

- [ ] Un-skip the test; converge HMT `.new`/build-through + plural inverse so
      `book.subscribers.new` round-trips. Test name/assertion unchanged.
- [ ] `pnpm vitest run` for the file green.
