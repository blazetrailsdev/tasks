---
title: "Converge or pair the 22 key-unread rows parity:api:key-reads lists"
status: done
updated: 2026-10-15
rfc: "0190-native-js-hash-forms"
cluster: null
packages: []
deps:
  - port-system-testing-browser-over-selenium-webdriver
deps-rfc: []
est-loc: 300
priority: null
pr: trails#8905
claim: "2026-10-14T15:30:10Z"
assignee: "key-read-report-key-unread-rows-converge"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:key-reads` (`scripts/api-compare/report-key-reads.ts`,
trails#8855) lists matched pairs where Rails reads a literal Symbol key off a
named receiver and the port reads other keys off that receiver but not this
one. At trails#8855 it listed 22 `key-unread` rows. No call gate sees any of
them. Each is either a dropped or rerouted option read, or a faithful port the
report cannot pair.

Rows at merge (`<ts file>#<ts name>  <receiver>[:key]`):

- `activerecord/nested-attributes.ts#assignNestedAttributesForCollectionAssociation`
  `options[:allow_destroy]` (`activerecord/lib/active_record/nested_attributes.rb`,
  `assign_nested_attributes_for_collection_association`).
- `activesupport/array-utils.ts#toSentence` `options[:words_connector]`,
  `[:two_words_connector]`, `[:last_word_connector]`
  (`activesupport/lib/active_support/core_ext/array/conversions.rb`, `to_sentence`).
- `actionview/helpers/output-safety-helper.ts#toSentence`, the same three keys
  (`actionview/lib/action_view/helpers/output_safety_helper.rb`, `to_sentence`).
- `actionview/base.ts#render` `options[:layout]`.
- `actiondispatch/system-testing/driver.ts#constructor` `@options[:browser]`
  (`actionpack/lib/action_dispatch/system_testing/driver.rb`, `initialize`).
- `trailties/generators/app-base.ts#dependsOnSystemTest` `options[:skip_system_test]`,
  `options[:skip_test]` (`railties/lib/rails/generators/app_base.rb`,
  `depends_on_system_test?`); the port calls `this.skip("SystemTest")` where
  Rails reads the two options directly.
- `rack/utils.ts#setCookieHeader`, eleven `value[:…]` keys
  (`vendor/rack/.../lib/rack/utils.rb`, `set_cookie_header`); the port reads
  them through an `opts = value` alias, so Rails' local name is lost.

## Acceptance criteria

- [ ] Each row is read against its Rails body. Where the port drops or
      reroutes the read, the body is converged: same receiver name, same key,
      same position (`options[:skip_test]` is `options.skipTest`, a local
      Rails calls `value` is `value`).
- [ ] Where the port is faithful and the report cannot pair it, the pairing
      rule is added to `report-key-reads.ts` with a test, as the `get("k")`,
      `match.groups` and `is`-predicate rules were.
- [ ] `pnpm parity:api:key-reads` lists no `key-unread` row that is not
      explained in the PR body.
- [ ] `pnpm parity:api:calls` and `:calls:args` stay green with no baseline row.
