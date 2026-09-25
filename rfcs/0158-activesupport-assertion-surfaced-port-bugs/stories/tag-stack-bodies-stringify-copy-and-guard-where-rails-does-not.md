---
title: "TagStack push/pop/tags stringify, copy and guard where tagged_logging.rb does not"
status: done
updated: 2026-09-25
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8080
claim: "2026-09-25T03:44:16Z"
assignee: "activesupport-has-no-psych-emitter-for-to-yaml"
blocked-by: null
closed-reason: null
---

## Context

`TagStack` in `packages/activesupport/src/tagged-logging.ts` was left as it was when #8066 moved `TaggedLogging` onto Rails' formatter-extension shape. Its bodies differ from `vendor/rails/activesupport/lib/active_support/tagged_logging.rb:70-102`:

- `attr_reader :tags` (`:71`) returns `@tags` itself. The trails `get tags()` returns a copy (`[...this._tags]`).
- `push_tags(tags)` (`:78-84`) runs `tags.flatten!`, then `tags.reject!(&:blank?)`, then `@tags.concat(tags)`, and returns `tags`. It keeps the tag objects as they are; they are stringified only by interpolation in `format_message`. trails runs `String(t)` on every tag before it filters, and it tests blankness with a whitespace regex, not `blank?`.
- `pop_tags(count)` (`:86-89`) is `@tags.pop(count)`, with no guards. trails adds `count <= 0` and clamping arms that Rails does not have.

## Converged shape

- `tags` returns the backing array.
- `pushTags` flattens, rejects with ActiveSupport's `isBlank`, concatenates, and returns the same array without stringifying.
- `popTags(count)` is Ruby `Array#pop(count)`, through ruby-compat if a port exists.
- `formatMessage` already interpolates through `rbObjAsString`, so non-String tags render the way Ruby's `"#{tag}"` does.

## Acceptance criteria

- [ ] The three bodies mirror `tagged_logging.rb:71-89`.
- [ ] The trails-only `TagStack` tests that assert stringification are updated to Rails' behavior or removed.
- [ ] `tagged_logging_test.rb` stays 29/29 with 0 assertion mismatches.
