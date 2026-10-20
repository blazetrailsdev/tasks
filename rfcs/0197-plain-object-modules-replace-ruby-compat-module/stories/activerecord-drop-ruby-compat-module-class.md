---
title: "activerecord: modules are plain objects, not ruby-compat Module instances"
status: done
updated: 2026-10-19
rfc: "0197-plain-object-modules-replace-ruby-compat-module"
cluster: null
packages: ["activerecord"]
deps:
  - remove-ruby-compat-module-class
  - inlined-from-admits-module-super-segments-on-methods
deps-rfc: []
est-loc: 700
priority: null
pr: trails#9099
claim: "2026-10-19T21:39:31Z"
assignee: "activerecord-drop-ruby-compat-module-class"
blocked-by: null
closed-reason: null
---

## Context

Part of `remove-ruby-compat-module-class` (RFC 0154): the repo owner does not want ruby-compat's `Module` class (`packages/ruby-compat/src/include.ts`, `export class Module`) or its spliced-carrier pattern, and no similar carrier shape may replace it. Kernel, Comparable and nokogiri's `Searchable` were converted first.

Sites in `packages/activerecord/src` (non-test) constructing or testing a `Module`:

- `packages/activerecord/src/associations.ts:221`
- `packages/activerecord/src/autosave-association.ts:80`
- `packages/activerecord/src/aggregations.ts:7`
- `packages/activerecord/src/base.ts:2017`
- `packages/activerecord/src/base.ts:2253`
- `packages/activerecord/src/core.ts:699`
- `packages/activerecord/src/core.ts:840`
- `packages/activerecord/src/namespaces.ts:237`
- `packages/activerecord/src/namespaces.ts:308`
- `packages/activerecord/src/inheritance.ts:29`
- `packages/activerecord/src/inheritance.ts:137`
- `packages/activerecord/src/persistence.ts:963`
- `packages/activerecord/src/transactions.ts:60`
- `packages/activerecord/src/validations.ts:46`
- `packages/activerecord/src/store.ts:53`
- `packages/activerecord/src/associations/foreign-association.ts:49`
- `packages/activerecord/src/associations/builder/collection-association.ts:40`
- `packages/activerecord/src/connection-adapters/deduplicable.ts:6`
- `packages/activerecord/src/associations/through-association.ts:199`
- `packages/activerecord/src/attribute-methods/dirty.ts:73`
- `packages/activerecord/src/connection-adapters/abstract/database-statements.ts:793`
- `packages/activerecord/src/connection-adapters/abstract/schema-definitions.ts:540`
- `packages/activerecord/src/connection-adapters/abstract/query-cache.ts:171`
- `packages/activerecord/src/connection-adapters/abstract/query-cache.ts:474`
- `packages/activerecord/src/encryption/extended-deterministic-queries.ts:110`
- `packages/activerecord/src/encryption/extended-deterministic-queries.ts:145`
- `packages/activerecord/src/encryption/extended-deterministic-queries.ts:153`
- `packages/activerecord/src/encryption/extended-deterministic-queries.ts:170`
- `packages/activerecord/src/locking/optimistic.ts:47`
- `packages/activerecord/src/encryption/encryptable-record.ts:79`
- `packages/activerecord/src/test-helpers/models/admin.ts:3`
- `packages/activerecord/src/test-helpers/models/company.ts:102`
- `packages/activerecord/src/touch-later.ts:10`
- `packages/activerecord/src/test-helpers/models/sharded/blog-post-destroy-async.ts:11`
- `packages/activerecord/src/test-helpers/models/sharded/comment-destroy-async.ts:11`
- `packages/activerecord/src/test-fixtures.ts:456`
- `packages/activerecord/src/marshalling.ts:54`
- `packages/activerecord/src/relation/delegation.ts:144`
- `packages/activerecord/src/timestamp.ts:211`
- `packages/activerecord/src/connection-adapters/mysql2/database-statements.ts:58`
- `packages/activerecord/src/encryption/encrypted-fixtures.ts:19`
- `packages/activerecord/src/migration/compatibility.ts:82`
- `packages/activerecord/src/migration/compatibility.ts:274`
- `packages/activerecord/src/migration/compatibility.ts:313`
- `packages/activerecord/src/migration/compatibility.ts:363`
- `packages/activerecord/src/migration/compatibility.ts:381`
- `packages/activerecord/src/migration/compatibility.ts:466`
- `packages/activerecord/src/migration/compatibility.ts:575`
- `packages/activerecord/src/callbacks.ts:20`
- `packages/activerecord/src/no-touching.ts:5`
- `packages/activerecord/src/attribute-methods.ts:439`
- `packages/activerecord/src/attribute-methods.ts:452`
- `packages/activerecord/src/connection-adapters/postgresql/schema-definitions.ts:113`
- `packages/activerecord/src/test-helpers/models/company-in-module.ts:6`
- `packages/activerecord/src/test-helpers/models/company-in-module.ts:7`
- `packages/activerecord/src/test-helpers/models/company-in-module.ts:9`
- `packages/activerecord/src/test-helpers/models/company-in-module.ts:11`
- `packages/activerecord/src/test-helpers/models/company-in-module.ts:13`
- `packages/activerecord/src/test-helpers/models/company-in-module.ts:15`
- `packages/activerecord/src/test-helpers/models/company-in-module.ts:17`
- `packages/activerecord/src/test-helpers/models/company-in-module.ts:19`
- `packages/activerecord/src/test-helpers/models/cpk.ts:6`
- `packages/activerecord/src/test-helpers/models/developer.ts:59`
- `packages/activerecord/src/test-helpers/models/post.ts:156`
- `packages/activerecord/src/test-helpers/models/post.ts:160`
- `packages/activerecord/src/test-helpers/models/sharded/blog-post-with-revision.ts:13`
- `packages/activerecord/src/test-helpers/models/sharded/blog-post-tag.ts:13`
- `packages/activerecord/src/trailties/controller-runtime.ts:40`
- `packages/activerecord/src/trailties/controller-runtime.ts:87`
- `packages/activerecord/src/relation/query-methods.ts:1011`
- `packages/activerecord/src/test-helpers/models/sharded/comment.ts:13`
- `packages/activerecord/src/trailties/job-runtime.ts:23`
- `packages/activerecord/src/test-helpers/models/sharded/blog-post.ts:17`
- `packages/activerecord/src/connection-adapters/mysql/schema-definitions.ts:49`
- `packages/activerecord/src/migration/command-recorder.ts:148`
- `packages/activerecord/src/test-helpers/models/sharded/tag.ts:14`
- `packages/activerecord/src/test-helpers/models/publisher.ts:3`
- `packages/activerecord/src/test-helpers/models/topic.ts:282`
- `packages/activerecord/src/encryption/extended-deterministic-uniqueness-validator.ts:12`
- `packages/activerecord/src/test-helpers/models/sharded/blog.ts:10`

Test files:

- `packages/activerecord/src/schema-loading.test.ts`
- `packages/activerecord/src/inheritance.test.ts`
- `packages/activerecord/src/adapters/postgresql/uuid.test.ts`
- `packages/activerecord/src/delegated-type.trails.test.ts`
- `packages/activerecord/src/serialized-attribute.test.ts`
- `packages/activerecord/src/migration/exclusion-constraint.test.ts`
- `packages/activerecord/src/migration/unique-constraint.test.ts`
- `packages/activerecord/src/trailties/controller-runtime.trails.test.ts`

76 non-test `superMethod(` calls (a module method's Ruby `super`), e.g.:

- `packages/activerecord/src/associations.ts:225`
- `packages/activerecord/src/associations.ts:316`
- `packages/activerecord/src/associations.ts:322`
- `packages/activerecord/src/autosave-association.ts:53`
- `packages/activerecord/src/autosave-association.ts:294`

Plain-object `include()` copies methods onto the class prototype, so these have no plain-object equivalent yet; the shape for module `super` is an owner decision (raised on the first PR). Do not invent a carrier for it.

## Acceptance criteria

Rescoped (trails#9099): the module-`super` and live-include sites, plus the four `deduplicated` `@inlinedFrom` tags, are carried by `activerecord-module-super-and-live-include-sites`.

- Every namespace-only module in `packages/activerecord/src` (test-helper `Sharded`, `MyApplication::*`, `Admin`, `Cpk`, `Publisher`, `Namespaced`, `Web`) is a plain object seated by `registerConstant` / `rbModConstSet`.
- Every module with no module `super` and no post-include definition (`Deduplicable`, `ForeignAssociation`, `ClassSpecificRelation`, abstract and MySQL `ColumnMethods`, `Validations`, `EncryptedFixtures`, `CommandRecorder::StraightReversions`, `Developer::ProjectsAssociationExtension2`) is a plain-object module, keeping the Rails module name, members and include order. The `super` calls into `StraightReversions` and `Deduplicable#deduplicated` are inlined per RFC 0197.
- Sites relying on live include or module `super` are listed in the PR body for the repo owner and filed as the follow-up story, not worked around.
