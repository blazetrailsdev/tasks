---
title: "converge AttributeMethodsTest off makeModel onto canonical models"
status: done
updated: 2026-08-29
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 600
priority: 19
pr: 7199
claim: "2026-08-29T10:44:34Z"
assignee: "converge-attribute-methods-test-off-makemodel"
blocked-by: null
closed-reason: null
---

## Context

PR #7188 converged `AttributeMethodsTest`'s first describe off `makeTopic()`,
but its sibling stand-in `makeModel()` survives in
`packages/activerecord/src/attribute-methods.test.ts` with ~30 callers. It
builds a `Post` declaring `title` / `body` / `score`, and its callers are
placeholder-shaped rather than ports: `await Post.create({ title: "alias_db" })`
then `expect(p.id).toBeDefined()`, where the Rails counterpart asserts
something specific about the method under test.

The affected tests and their Rails counterparts in
`vendor/rails/activerecord/test/cases/attribute_methods_test.rb` include
`#alias_attribute with an _in_database method issues raises an error`,
`#alias_attribute with enum method raises an error`,
`#alias_attribute with an association method raises an error`,
`#alias_attribute with an overridden original method along with an overridden
alias method uses the overridden alias method`,
`declared prefixed/suffixed/affixed attribute method affects respond_to? and
method_missing`, `should unserialize attributes for frozen records`,
`user-defined time attribute predicate`, `inherited custom accessors with
reserved names`, `calling super when the parent does not define method raises
NoMethodError`, `caching a nil primary key`, `respond_to?` and
`attribute_present`.

The canonical models those tests need already exist:
`test-helpers/models/topic.ts`, `developer.ts`, `computer.ts`, `company.ts` —
the same four `fixtures :topics, :developers, :companies, :computers`
(`attribute_methods_test.rb:34`) that the describe now loads.

## Converged shape

`makeModel()` is deleted with its last caller. Each test reads the canonical
model its Rails counterpart reads and asserts what Rails asserts — the raised
error class and message for the `alias_attribute` arms, the predicate's value
for the predicate arms — instead of `toBeDefined()`.

Likely larger than one PR; split by Rails test group (the `alias_attribute`
arms, the `attribute_method_prefix/suffix/affix` arms, the rest) if so.

## Acceptance criteria

- [ ] `makeModel()` is deleted; no test in the file builds a bespoke `Post`.
- [ ] Each converted test asserts its Rails counterpart's assertions.
- [ ] `pnpm parity:test:assertions` delta non-negative; AR suite green on all
      three lanes.
