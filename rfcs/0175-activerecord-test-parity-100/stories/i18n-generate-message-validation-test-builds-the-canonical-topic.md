---
title: "activerecord: i18n generate-message validation test builds the canonical Topic"
status: ready
updated: 2026-10-08
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced landing trails#8663.

Rails' `I18nGenerateMessageValidationTest` builds the canonical model
(`vendor/rails/v8.0.2/activerecord/test/cases/validations/i18n_generate_message_validation_test.rb:9-12`):

```ruby
def setup
  @topic = Topic.new
  I18n.backend = I18n::Backend::Simple.new
end
```

`packages/activerecord/src/validations/i18n-generate-message-validation.test.ts` builds a local class
in `makeTopic()` instead: `class Topic extends Base` with `_tableName = "topics"` and two hand-declared
attributes. trails#8663 had to add `this.aliasAttribute("heading", "title")` to it by hand
(`vendor/rails/v8.0.2/activerecord/test/models/topic.rb:70`), because `read_attribute_for_validation`
is `send` and the last test reads `:heading`. The canonical model
(`packages/activerecord/src/test-helpers/models/topic.ts:149`) already declares it.

## Acceptance criteria

- [ ] `makeTopic()` and its local class are deleted; the suite builds `new Topic()` from `packages/activerecord/src/test-helpers/models/topic.ts` in a `beforeEach`, over `fixtures(...)` for the canonical schema.
- [ ] Test names unchanged; `pnpm parity:test:assertions` green.
