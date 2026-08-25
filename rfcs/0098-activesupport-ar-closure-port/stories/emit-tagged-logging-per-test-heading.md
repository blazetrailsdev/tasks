---
title: "Emit TaggedLogging's per-test heading and retire the before_setup skip"
status: done
updated: 2026-08-14
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6494
claim: "2026-08-13T21:27:10Z"
assignee: "drop-assert-valid-keys-set-for-rails-include"
blocked-by: null
closed-reason: null
---

## Context

PR #6477 ported `ActiveSupport::Testing::TaggedLogging`
(activesupport/lib/active_support/testing/tagged_logging.rb) at
`packages/activesupport/src/testing/tagged-logging.ts`, but only its
`tagged_logger` reader and `attr_writer`. The module's actual PURPOSE — the
per-test heading it logs — is unported:

```ruby
def before_setup
  if tagged_logger && tagged_logger.info?
    heading = "#{self.class}: #{name}"
    divider = "-" * heading.size
    tagged_logger.info divider
    tagged_logger.info heading
    tagged_logger.info divider
  end
  super
end
```

(tagged_logging.rb:10-19). The module comment states the intent: "Logs a
'PostsControllerTest: test name' heading before each test to make test.log
easier to search and follow along with."

PR #6477 registered `before_setup` in `SCOPED_SKIP_GROUPS`
(`scripts/parity/conventions.ts`, scoped to `testing/tagged_logging.rb`) with
the reason that Minitest lifecycle has no vitest receiver a module can be mixed
into. That reason is accurate about `include`, but it is not obviously true that
the BEHAVIOUR is unreachable: vitest has `beforeEach`, and `_testCaseIdentity`
(same file) already recovers `#{self.class}: #{name}` from
`expect.getState().currentTestName`. A SKIP entry is debt, not a decision.

## Converged shape

Emit the divider/heading/divider trio through `taggedLogger()` before each test,
using the test-case identity the module already computes, from whatever vitest
hook the AR/AS suites can install centrally (`cases/helper.ts` is the port of
Rails' `helper.rb` and is where suite-wide setup belongs). If it lands, delete
the `before_setup` row from `SCOPED_SKIP_GROUPS` — a skip that is no longer true
is itself a red gate.

If it genuinely cannot be reached without per-file opt-in, `pnpm tasks block`
with that finding rather than re-justifying the skip.

## Acceptance criteria

- [ ] A configured tagged logger receives `divider` / `"<TestCase>: <name>"` /
      `divider` at `info` level before each test.
- [ ] The `info?` guard is honoured (nothing logged when the logger is not at
      info).
- [ ] The `before_setup` row is gone from `SCOPED_SKIP_GROUPS`, or the story is
      blocked with the specific blocker.
