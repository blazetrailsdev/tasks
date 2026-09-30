---
title: "activerecord: port finder_test.rb's 16 other missing cases"
status: ready
updated: 2026-09-30
rfc: "0175-activerecord-test-parity-100"
cluster: missing-tests
packages: ["activerecord"]
deps: ["port-finder-find-without-primary-key-onto-matey"]
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The rest of `finder_test.rb`'s missing cases (`vendor/rails/v8.0.2/activerecord/test/cases/finder_test.rb`):

- "find with hash parameter"
- "symbols table ref"
- "any with scope on hash includes"
- "find an empty array"
- "unexisting record exception handling"
- "find on hash conditions with explicit table name and aggregate"
- "find on hash conditions with open ended range"
- "count by sql"
- "dynamic finder on one attribute with conditions returns same results after caching"
- "find with bad sql"
- "joins with string array"
- "select value"
- "select values"
- "find with nil inside set passed for attribute"
- "custom select takes precedence over original value"
- "find one message on primary key"

## Acceptance criteria

- [ ] Each case ported under Rails' name, onto canonical models/fixtures, with Rails' assertion kinds.
- [ ] `pnpm parity:test` shows `finder_test.rb` 261/261 once `activerecord-port-finder-test-find-by-cases` also lands.
