---
title: "adapter.test.ts leases its connection as adapter_test.rb does"
status: draft
updated: 2026-09-22
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `AdapterTest` leases its connection in `setup`:
`@connection = ActiveRecord::Base.lease_connection`
(`activerecord/test/cases/adapter_test.rb:13`), and other cases read
`ActiveRecord::Base.lease_connection` (`:20,:166,:182,:186`). The trails port
(`packages/activerecord/src/adapter.test.ts`) reads the deprecated `Base.connection`
38 times in test bodies (for example `:279`, in `it("indexes")`).

That only works because every `fixtures()` registration still resolves
`leaseFixtureConnection` before each test. trails#7976 kept that as the default adapter
getter (`packages/activerecord/src/test-fixtures.ts` `fixtures()`) after finding that,
without it, a non-transactional (`usesTransaction`) test following a transactional one
raises `Called deprecated ActiveRecord::Base.connection method`. This is Rails' own
behaviour: `unpin_connection!` checks the connection in, the lease's `sticky` goes nil, and
`permanent_lease?` is `sticky.nil?` (`connection_pool.rb:321-323,388-394`).

## Acceptance criteria

- `adapter.test.ts` leases as `adapter_test.rb` does (`await Base.leaseConnection()` in a
  `beforeEach`, and at the reads Rails spells `lease_connection`), with no `Base.connection`
  reads left.
- Then `fixtures()` no longer needs `leaseFixtureConnection` as its default getter for this
  file. Remove the default if no other file depends on it, or record which files still do,
  in `converge-with-transactional-fixtures-onto-test-fixtures-setup`.
