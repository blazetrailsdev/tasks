---
title: "port-preloadertest-fixture-declaration"
status: done
updated: 2026-07-30
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5618
claim: "2026-07-29T22:36:01Z"
assignee: "port-preloadertest-fixture-declaration"
blocked-by: null
closed-reason: null
---

## Context

`associations.test.ts`'s `PreloaderTest` declares `fixtures([])` and every test
in it builds its records ad hoc. Rails' counterpart declares 20 fixture sets at
class level (`vendor/rails/activerecord/test/cases/associations_test.rb:803-806`):

```ruby
fixtures :posts, :comments, :books, :authors, :tags, :taggings, :essays,
         :categories, :author_addresses, :sharded_blog_posts, :sharded_comments,
         :sharded_blog_posts_tags, :sharded_tags, :members, :member_details,
         :organizations, :cpk_orders, :cpk_order_agreements, :dogs, :other_dogs
```

so its tests read `posts(:welcome)` / `comments(:greetings)` / `dogs(:sophie)`
rather than constructing records.

Found while converging `multi database polymorphic preload with same table name`
onto the canonical arunit2 pool. That test now uses the canonical
`OtherDog < ARUnit2Model`, but still builds `new Comment({ origin_id: 1,
origin_type: "OtherDog" })` where Rails uses `other_dogs(:lassie)` +
`comments(:more_greetings)`. The fixture data already exists in trails
(`test-helpers/fixtures/{dogs,other-dogs}.ts`), and `other_dogs` seeds through
`OtherDog.connection` the way `multiple-db.test.ts` seeds arunit2 sets.

## Why it is its own story

Adding the fixture sets piecemeal does not work: switching `fixtures([])` to
`fixtures(["dogs", "comments"])` fails ~12 other `PreloaderTest` tests, which
currently assume no pre-seeded rows (query-count and duplicate-record
assertions). The declaration has to be ported wholesale, with each affected test
converted to fixture accessors in the same change.

## Acceptance criteria

- `PreloaderTest` declares the fixture sets from `associations_test.rb:803-806`
  that its ported tests reference (`other_dogs` through `OtherDog.connection`,
  the rest primary).
- Tests in the describe read fixture accessors instead of building records,
  matching their Rails bodies. No test renamed.
- `multi database polymorphic preload with same table name` uses
  `dogs(:sophie)` / `other_dogs(:lassie)` / `comments(:greetings)` /
  `comments(:more_greetings)` per `associations_test.rb:1239-1249`.
- test:compare assertion-count/kind mismatch counts for `associations_test.rb`
  do not regress.
