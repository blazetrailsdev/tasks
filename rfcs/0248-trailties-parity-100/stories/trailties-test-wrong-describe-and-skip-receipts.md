---
title: "trailties: fix the 16 wrong describes and receipt or port the 42 skips"
status: done
updated: 2026-11-26
rfc: "0248-trailties-parity-100"
cluster: receipts
packages: [trailties]
deps: [trailties-test-move-misplaced-tests]
deps-rfc: []
est-loc: 350
priority: null
pr: trails#10780
claim: "2026-11-26T02:44:42Z"
assignee: "long-running-commands-boot-from-the-build-entry"
blocked-by: null
closed-reason: null
---

## Context

`parity:test` reports 16 wrong-describe rows (7 in `generators/app-generator.test.ts`,
3 in `trailties/engine.test.ts`, 4 in `engine/lazy-route-set.test.ts`, and 2 in
`application/action-controller-test-case-integration.test.ts`) and 42 skips:

| File                                          | Skips |
| --------------------------------------------- | ----: |
| `generators/namespaced_generators_test.rb`    |    18 |
| `application/initializers/i18n_test.rb`       |    17 |
| `application/initializers/frameworks_test.rb` |     5 |
| `application/mailer_previews_test.rb`         |     2 |

RFC 0142 owns several of the lib gaps behind these skips (for example
`i18n-railtie-initializers-unported`, `i18n-railtie-initialize-i18n-applies-config`,
`generators-port-module-namespacing`). This story un-skips the tests whose lib
work has landed, and adds the 0142 story as a dep note for the rest.

## Acceptance criteria

- [ ] Desc is 0 for trailties.
- [ ] Each remaining skip either runs, or carries `PERMANENT-SKIP:` with a section, or names the open 0142 story that unblocks it.
- [ ] At RFC close, every skip is `PERMANENT-SKIP:`.
