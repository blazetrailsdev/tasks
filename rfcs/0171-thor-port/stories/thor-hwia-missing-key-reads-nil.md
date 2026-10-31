---
title: "Thor HWIA [] on a missing key answers nil, not undefined"
status: claimed
updated: 2026-10-31
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: "2026-10-31T18:42:46Z"
assignee: "activestorage-test-helper-users-attachments"
blocked-by: null
closed-reason: null
---

## Context

`Thor::CoreExt::HashWithIndifferentAccess#[]` (`vendor/thor/v1.3.2/lib/thor/core_ext/hash_with_indifferent_access.rb:30-32`) is `super(convert_key(key))`, so a missing key answers `nil` (Hash default). In trails, `this.options["fourth"]` on a `MyCounter` run without `--fourth` answers `undefined` (observed while smoke-testing `MyCounter.start(["1","2","--third","3"])` for trails#9465: result `[1, 2, 3, undefined, undefined, undefined]` where Ruby gives `[1, 2, 3, nil, nil, nil]`). Fixture: `packages/thor/src/test-helpers/fixtures/group.ts` `four`/`five`/`six`.

## Acceptance criteria

- [ ] A missed key read on Thor's HWIA answers `null`, matching `Hash#[]`'s default.
- [ ] `group_spec.rb`'s invoke-all result assertion (once ported) compares against `null` without a workaround.
