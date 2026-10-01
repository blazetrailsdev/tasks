---
title: "test-fixture-accessors-are-untyped"
status: in-progress
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: trails#8310
claim: "2026-09-30T23:30:33Z"
assignee: "test-fixture-accessors-are-untyped"
blocked-by: null
closed-reason: null
---

## Context

Rails' `TestFixtures` defines one accessor per fixture set, so a test reads
`posts(:one)` and gets a `Post`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/test_fixtures.rb:72-90`,
`setup_fixture_accessors`). The scaffold's functional test template does
`@post = posts(:one)`.

trails' generated controller test calls
`(await this.fixture("posts", "one")) as Post`, with a cast, because
`fixture(fixtureSetName: string, ...fixtureNames: unknown[]): unknown`
(`packages/activerecord/src/test-fixtures.ts:245`) is untyped. There is no per-set
accessor either, which diverges from Rails' `posts(:one)` spelling.

Found auditing the types of a freshly scaffolded app (`trails new blog` + `generate scaffold Post title:string body:text`) on `main` `53a6249ae6`, while writing the README for PR #8195.

## Converged shape

- Port `setup_fixture_accessors`, so a test class gets `this.posts("one")` per set.
- Type each accessor from the fixture set's model (`test/fixtures/posts.yml` → `Post`,
  through the table-name → model mapping `fixtures` already does).
- Update the scaffold test template to `this["@post"] = await this.posts("one")` with no cast.

## Acceptance criteria

- [ ] The generated controller test has no `as Post` cast and type-checks.
- [ ] `this.posts("missing")` still raises as Rails does.
