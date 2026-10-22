---
title: "TestHelper kwarg assertions raise unknown-keyword ArgumentError like assert_enqueued_with"
status: done
updated: 2026-10-22
rfc: "0169-activejob-package-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#9228
claim: "2026-10-22T16:56:27Z"
assignee: "activejob-log-subscriber-tally-keys-on-class-identity"
blocked-by: null
closed-reason: null
---

## Context

Every `ActiveJob::TestHelper` assertion takes Ruby keyword arguments, so a caller passing an unknown keyword gets `ArgumentError: unknown keyword: :x` from the `def` header (`vendor/rails/v8.0.2/activejob/lib/active_job/test_helper.rb:122,186,278,348,510,620`). trails#9219 converged `assertEnqueuedWith` (`:406`): its destructure collects `...keywordHash` and calls `rbGetKwargs(keywordHash, [])` (`packages/activejob/src/test-helper.ts`, receipt `@inventedArm rbGetKwargs — PERMANENT`). The siblings still destructure their options and silently drop an unknown key:

- `assertEnqueuedJobs` / `assertNoEnqueuedJobs`: `only:, except:, queue:`
- `assertPerformedJobs` / `assertNoPerformedJobs`: `only:, except:, queue:`
- `assertPerformedWith`: `job:, args:, at:, queue:, priority:`
- `performEnqueuedJobs`: `only:, except:, queue:, at:`

## Acceptance criteria

- [ ] Each method listed above raises Ruby's `unknown keyword` `ArgumentError` for an unknown option key, in the same shape as `assertEnqueuedWith`: the `...keywordHash` rest in the destructure plus `rbGetKwargs(keywordHash, [])`, called before `requireActiveJobTestAdapterBang`.
- [ ] Each method carries the `@inventedArm rbGetKwargs — PERMANENT` receipt.
- [ ] A trails test per method passes an unknown key and asserts the `ArgumentError`.
