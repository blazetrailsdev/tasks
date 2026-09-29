---
title: "Port Hash.ruby2_keywords_hash? / Hash.ruby2_keywords_hash to ruby-compat"
status: draft
updated: 2026-09-29
rfc: "0000-activejob-package-port"
cluster: null
packages: ["ruby-compat"]
deps: []
deps-rfc: []
est-loc: 200
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

ActiveJob round-trips keyword arguments through job data using Ruby's
ruby2_keywords flag. `Core#initialize` and `Enqueuing::ClassMethods#job_or_instantiate`
are marked `ruby2_keywords` (`vendor/rails/v8.0.2/activejob/lib/active_job/core.rb:103`, `enqueuing.rb:94`), so a trailing
kwargs hash reaches `Arguments.serialize_argument` flagged.
`serialize_argument` records that as `_aj_ruby2_keywords` (`arguments.rb:93-97`),
and `deserialize_hash` re-flags the hash with `Hash.ruby2_keywords_hash`
(`:153-155`). The fixtures `KwargsJob#perform(argument: 1)` and
`MultipleKwargsJob#perform(argument1:, argument2:)` depend on it
(`vendor/rails/v8.0.2/activejob/test/jobs/kwargs_job.rb`, `multiple_kwargs_job.rb`), and
`argument_serialization_test.rb` `"allows for keyword arguments"` (`:250`) asserts it.

trails has no counterpart: nothing under `packages/` defines
`ruby2KeywordsHash` or a kwargs flag. MRI stores the flag on the hash object
(`RHASH_PASS_AS_KEYWORDS`, `vendor/ruby/v3.3.11/hash.c`,
`rb_hash_s_ruby2_keywords_hash_p` / `rb_hash_s_ruby2_keywords_hash`). Port the
two singleton methods into ruby-compat as `rbHashSRuby2KeywordsHashP(hash)` /
`rbHashSRuby2KeywordsHash(hash)` over a module-private `WeakSet` of flagged
objects. `ruby2_keywords_hash` returns a flagged **copy**, as MRI's does. Each
carries its `@noRailsEquivalent PERMANENT` inventory receipt.

The same story records the trails kwargs idiom this flag serves: a trailing
plain-object argument to `performLater` / `new` is the kwargs hash, and
`job_or_instantiate` / `initialize` flag it before storing `arguments`.
Write that rule in the ruby-compat README beside the other idioms.

## Fidelity traps (predicted at authoring)

- [ ] The flag must not be visible to `Object.keys` / `JSON.stringify`: job data is serialized, and a stray key would round-trip into `_aj_*` territory.

## Acceptance criteria

- [ ] Both functions port their MRI bodies, and `vendor/ruby/v3.3.11/hash.c` citations resolve (`ruby-compat-needs-mri-citation`).
- [ ] `rbHashSRuby2KeywordsHash(h)` returns a flagged copy and leaves `h` unflagged; `rbHashSRuby2KeywordsHashP` answers per object identity.
- [ ] `pnpm parity:api:extra:gate` is green (receipted inventory).

## Definition of done

A flag stored as an enumerable property on the hash (which would serialize into job data) does not close this story.
