---
title: "Port Testing::TaggedLogging so tagged_logger is the module's, with the test-case identity prefix"
status: done
updated: 2026-08-13
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6477
claim: "2026-08-13T16:45:43Z"
assignee: "fold-grouped-composite-assoc-into-one-grouped-body"
blocked-by: null
closed-reason: null
---

## Context

PR #6460 ported `_assert_nothing_raised_or_warn`
(activesupport/lib/active_support/testing/assertions.rb:281-294), whose rescue
arm warns through `tagged_logger`. `tagged_logger` is a private method on
`ActiveSupport::Testing::TaggedLogging`
(activesupport/lib/active_support/testing/tagged_logging.rb:22-24):

```ruby
attr_writer :tagged_logger

def before_setup
  if tagged_logger && tagged_logger.info?
    heading = "#{self.class}: #{name}"
    ...
  end
  super
end

private
  def tagged_logger
    @tagged_logger ||= (defined?(Rails.logger) && Rails.logger)
  end
```

trails has no `packages/activesupport/src/testing/tagged-logging.ts`. #6460
inlined a `taggedLogger()` in `packages/activesupport/src/testing/assertions.ts`
that reads the late-bound `trailsLogger` slot — the `defined?(Rails.logger) &&
Rails.logger` arm only. Two consequences:

1. There is no `tagged_logger=` writer, so a test cannot point the warning at
   its own logger the way Rails' `attr_writer` allows.
2. The warning's first line drops Ruby's `#{self.class} - #{name}:` prefix
   (assertions.rb:285) because a free function has no Minitest test-case
   instance to read the class or the running test's name from.

## Converged shape

Port `ActiveSupport::Testing::TaggedLogging` at
`packages/activesupport/src/testing/tagged-logging.ts` with `taggedLogger` and
its writer, have `assertions.ts` read it there instead of its inline copy, and
restore the `#{self.class} - #{name}:` prefix from whatever test-case identity
the ported module can carry (vitest exposes the running test's name through
`expect.getState().currentTestName`, which is the closest analogue to Minitest's
`name`). `before_setup` is Minitest lifecycle — if it has no vitest equivalent,
it belongs in a `SKIP_GROUPS` entry with that reason, not a stub.

## Acceptance criteria

- [ ] `testing/tagged-logging.ts` exists with `taggedLogger` and its writer.
- [ ] `assertions.ts` drops its inline `taggedLogger()` and reads the module's.
- [ ] The `_assertNothingRaisedOrWarn` warning carries the test-case identity
      prefix, asserted in a test.
