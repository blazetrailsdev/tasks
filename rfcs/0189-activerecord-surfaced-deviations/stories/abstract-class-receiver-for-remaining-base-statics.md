---
title: "abstract-class-receiver-for-remaining-base-statics"
status: draft
updated: 2026-11-12
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10045 let an AR abstract class be a TypeScript `abstract class` for `where`, `all`, `from`, `loadSchema` and `columnNames`. To do that it gave those statics an `AbstractModel` receiver (`packages/activerecord/lib/base.ts`, `querying.ts`). About 130 other statics still type their receiver as `this: typeof Base` or `T extends typeof Base`. On an `abstract class A extends Base` the following are still rejected: `A.find`, `A.first`, `A.count`, `A.findBy`, `A.order` and `A.limit` (probed with a dts test). Rails runs every one of them on an abstract class through `all` (`querying.rb` delegation). Only `new` and `create` raise there (`inheritance.rb:56-78`).

## Acceptance criteria

- [ ] Every static that does not construct takes an `AbstractModel` receiver. This covers the `Querying` delegators, finders, calculations and the scoping readers.
- [ ] `new` and `create` / `createBang` keep the concrete bound.
- [ ] `dx-tests/abstract-class.test-d.ts` exercises `find`, `first`, `count`, `findBy`, `order` and `limit` on the abstract class.
