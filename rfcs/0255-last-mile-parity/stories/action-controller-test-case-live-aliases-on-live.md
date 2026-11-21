---
title: "actionpack: TestCase's original_* aliases live on Live"
status: done
updated: 2026-11-21
rfc: "0255-last-mile-parity"
cluster: actionpack
packages: [actionpack]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#10488
claim: "2026-11-21T13:05:55Z"
assignee: "action-controller-test-case-live-aliases-on-live"
blocked-by: null
closed-reason: null
---

## Context

`parity:api` lists `original_new_controller_thread` and
`original_clean_up_thread_locals`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/test_case.rb`, the
`alias` lines inside its `Live` reopen) as missing. trails installs them with
`Object.assign(Live, …)`, which the extractor does not credit.

## Acceptance criteria

- [ ] Both aliases are declared where Rails declares them and credited on `parity:api`.
- [ ] `test_case.rb` shows 0 API missing.

## Verification

```sh
pnpm parity:api --missing --package actionpack
```
