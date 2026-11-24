---
title: "invented-arms-on-class-owned-and-shared-body-pairs"
status: ready
updated: 2026-11-24
rfc: "0156-parity-beyond-name-presence"
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

Story `class-owned-and-shared-body-skeletons-pair-by-owner` made `skeletonsOfOwner`
(`scripts/api-compare/compare.ts`) read a class owner's and a shared body's skeleton by owner, so
these pairs reach `pnpm parity:api:arms:report` for the first time. Each row is
`<ts file>#<ts name>: <arm diff>` (`+token` is an arm the port adds). Also
`i18n/utils.ts#deepSymbolizeKeys` (`vendor/i18n/*/lib/i18n/utils.rb` `deep_symbolize_keys`):
the `hash instanceof Map ? hash : Object.entries(hash)` arm, receipted CONVERGEABLE to this story.
Re-derive with `pnpm tsx scripts/api-compare/report-arms.ts --sample=100000` (125 pairs at filing).

**actioncable** (1)

- `actioncable/subscription-adapter/redis.ts#shutdown`: `+if`

**actioncontroller** (2)

- `actioncontroller/metal/live.ts#write`: `+if`
- `actioncontroller/metal/mime-responds.ts#any`: `+if`

**actiondispatch** (21)

- `actiondispatch/http/mime-type.ts#constructor`: `+if +if +if`
- `actiondispatch/http/parameters.ts#pathParameters`: `+if`
- `actiondispatch/http/response.ts#abort`: `+if`
- `actiondispatch/http/response.ts#body`: `+if +if +throw +if +if +throw`
- `actiondispatch/http/response.ts#toAry`: `+if`
- `actiondispatch/journey/path/pattern.ts#constructor`: `+if +loop +if +if`
- `actiondispatch/journey/router/utils.ts#unescapeUri`: `-if +loop +loop +loop`
- `actiondispatch/journey/visitors.ts#nary`: `+loop`
- `actiondispatch/journey/visitors.ts#terminal`: `+if`
- `actiondispatch/journey/visitors.ts#visit`: `+if +if +if +if +if +if +if +if`
- `actiondispatch/middleware/exception-wrapper.ts#constructor`: `+if`
- `actiondispatch/middleware/remote-ip.ts#constructor`: `+if`
- `actiondispatch/middleware/server-timing.ts#call`: `+loop +loop`
- `actiondispatch/middleware/server-timing.ts#unsubscribe`: `+if`
- `actiondispatch/middleware/session/abstract-store.ts#constructor`: `+if +if`
- `actiondispatch/middleware/stack.ts#build`: `+if`
- `actiondispatch/request/session.ts#find`: `+if`
- `actiondispatch/request/utils.ts#handleArray`: `+loop`
- `actiondispatch/routing/mapper.ts#constraints`: `+loop`
- `actiondispatch/routing/redirection.ts#path`: `+if`
- `actiondispatch/testing/integration.ts#urlOptions`: `+if`

**actionview** (17)

- `actionview/buffers.ts#capture`: `+if +try +if`
- `actionview/digestor.ts#digest`: `+if`
- `actionview/flows.ts#get`: `+rescue +throw`
- `actionview/helpers/date-helper.ts#selectDate`: `+if +if +if`
- `actionview/helpers/date-helper.ts#selectDatetime`: `+if +if +if +if +if`
- `actionview/helpers/date-helper.ts#selectDay`: `+if`
- `actionview/helpers/date-helper.ts#selectHour`: `+if +if +if`
- `actionview/helpers/date-helper.ts#selectMonth`: `+loop +if`
- `actionview/helpers/date-helper.ts#selectTime`: `+if`
- `actionview/helpers/date-helper.ts#selectYear`: `+if +if +if`
- `actionview/helpers/form-helper.ts#fields`: `+if +if +if +if`
- `actionview/helpers/form-helper.ts#fieldsFor`: `+if`
- `actionview/lookup-context.ts#digestCache`: `+if`
- `actionview/template/error.ts#constructor`: `+if`
- `actionview/template/resolver.ts#_findAll`: `+if +if`
- `actionview/view-paths.ts#_prefixes`: `+if`
- `actionview/view-paths.ts#viewPaths`: `+if`

**activejob** (1)

- `activejob/core.ts#deserialize`: `+throw +if +if`

**activemodel** (2)

- `activemodel/attribute-methods.ts#constructor`: `+if +if +if +if`
- `activemodel/validator.ts#constructor`: `+if +if`

**activerecord** (47)

- `activerecord/associations/errors.ts#constructor`: `-if`
- `activerecord/associations/errors.ts#corrections`: `+if`
- `activerecord/associations/preloader/association.ts#loadRecords`: `+if +if`
- `activerecord/attribute-methods/primary-key.ts#id`: `+if`
- `activerecord/connection-adapters/abstract/connection-pool.ts#get`: `+if`
- `activerecord/connection-adapters/abstract/connection-pool.ts#schemaReflection`: `+if`
- `activerecord/connection-adapters/abstract/connection-pool.ts#serverVersion`: `+if +if +try`
- `activerecord/connection-adapters/abstract/connection-pool/queue.ts#internalPoll`: `+if`
- `activerecord/connection-adapters/abstract/query-cache.ts#computeIfAbsent`: `+if +if`
- `activerecord/connection-adapters/abstract/schema-definitions.ts#constructor`: `+if`
- `activerecord/connection-adapters/abstract/schema-definitions.ts#isDefinedFor`: `+if +if`
- `activerecord/connection-adapters/abstract/schema-definitions.ts#references`: `+if`
- `activerecord/connection-adapters/abstract/transaction.ts#afterCommit`: `+if`
- `activerecord/connection-adapters/abstract/transaction.ts#afterRollback`: `+if`
- `activerecord/connection-adapters/abstract/transaction.ts#beforeCommit`: `+if`
- `activerecord/connection-adapters/column.ts#constructor`: `+if`
- `activerecord/connection-adapters/schema-cache.ts#version`: `+if`
- `activerecord/errors.ts#constructor`: `+if`
- `activerecord/errors.ts#setQuery`: `+if`
- `activerecord/fixtures.ts#constructor`: `+if`
- `activerecord/fixtures.ts#get`: `+if`
- `activerecord/insert-all.ts#constructor`: `+loop +if`
- `activerecord/message-pack.ts#constructor`: `+loop`
- `activerecord/migration.ts#changeTable`: `+if +if`
- `activerecord/migration.ts#constructor`: `-if`
- `activerecord/migration.ts#createJoinTable`: `+if +if`
- `activerecord/migration.ts#createTable`: `+if +if`
- `activerecord/migration.ts#currentVersion`: `+if`
- `activerecord/migration.ts#migration`: `+if +try +if`
- `activerecord/migration/compatibility.ts#createTable`: `+if`
- `activerecord/reflection.ts#activeRecordPrimaryKey`: `+if`
- `activerecord/reflection.ts#associationForeignKey`: `+if`
- `activerecord/reflection.ts#associationPrimaryKey`: `+if`
- `activerecord/reflection.ts#autosave`: `+if`
- `activerecord/reflection.ts#canFindInverseOfAutomatically`: `+if`
- `activerecord/reflection.ts#checkValidityBang`: `+if +if`
- `activerecord/reflection.ts#extensions`: `+if +if`
- `activerecord/reflection.ts#joinIdFor`: `+if +if +if`
- `activerecord/reflection.ts#joinPrimaryKey`: `+if`
- `activerecord/reflection.ts#joinTable`: `+if`
- `activerecord/reflection.ts#klass`: `+if +if`
- `activerecord/relation.ts#inspect`: `+if +if`
- `activerecord/relation/merger.ts#constructor`: `+if`
- `activerecord/relation/merger.ts#merge`: `+if`
- `activerecord/statement-cache.ts#bind`: `+if`
- `activerecord/statement-cache.ts#sqlFor`: `+if`
- `activerecord/type/adapter-specific-registry.ts#call`: `+loop +if +if`

**activesupport** (16)

- `activesupport/cache.ts#constructor`: `+if +if +if`
- `activesupport/cache/strategy/local-cache.ts#readMultiEntries`: `+loop +loop`
- `activesupport/callbacks.ts#build`: `+if`
- `activesupport/callbacks.ts#call`: `+if +if +throw`
- `activesupport/callbacks.ts#invertedLambda`: `+if +throw`
- `activesupport/callbacks.ts#makeLambda`: `+if +if +throw`
- `activesupport/code-generator.ts#defineCachedMethod`: `+if`
- `activesupport/core-ext/object/json.ts#asJson`: `+try +if +loop +loop`
- `activesupport/deprecation/proxy-wrappers.ts#constructor`: `+throw`
- `activesupport/deprecation/proxy-wrappers.ts#target`: `+if`
- `activesupport/encrypted-configuration.ts#constructor`: `+if`
- `activesupport/execution-wrapper.ts#before`: `+if`
- `activesupport/key-generator.ts#generateKey`: `+if`
- `activesupport/message-encryptor.ts#constructor`: `+if +if +if`
- `activesupport/ordered-options.ts#toH`: `+if`
- `activesupport/tagged-logging.ts#popTags`: `+if +throw`

**did-you-mean** (1)

- `did-you-mean/jaro-winkler.ts#distance`: `+if +if`

**i18n** (2)

- `i18n/backend/transliterator.ts#transliterate`: `+if`
- `i18n/exceptions.ts#constructor`: `+if`

**mail** (1)

- `mail/field.ts#constructor`: `+if`

**rack** (4)

- `rack/events.ts#call`: `+if +throw`
- `rack/lint.ts#each`: `+if +loop +if`
- `rack/request.ts#deleteParam`: `+if`
- `rack/request.ts#updateParam`: `+if +if +if`

**rack-session** (2)

- `rack-session/abstract/id.ts#extractSessionId`: `+if`
- `rack-session/cookie.ts#constructor`: `+if +if +if +if`

**rack-test** (1)

- `rack-test/cookie-jar.ts#constructor`: `+loop +if +if`

**rails-html-sanitizer** (2)

- `rails-html-sanitizer/sanitizer.ts#allowedAttributes`: `+if`
- `rails-html-sanitizer/sanitizer.ts#allowedTags`: `+if`

**solid-queue** (1)

- `solid-queue/process/prunable.ts#prune`: `+loop`

**thor** (1)

- `thor/command.ts#run`: `+throw`

**trailties** (3)

- `trailties/commands/console.ts#constructor`: `+if`
- `trailties/generators/trails/app/app-generator.ts#constructor`: `+if +if +if +throw +if +throw`
- `trailties/source-annotation-extractor.ts#annotations`: `-if`

## Acceptance criteria

- [ ] Each pair is converged onto Rails' control flow, or its invented arm carries an `@inventedArm` receipt.
- [ ] A comparer artefact (mispairing, idiom fold) is fixed in the comparer, not receipted.
- [ ] `pnpm parity:api:arms:throws` stays green without raising a mark.
- [ ] Split per package into follow-up stories if one PR cannot hold it.
