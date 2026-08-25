---
title: "UnexpectedError#message/#backtrace read the wrapped error at call time and filter the trace"
status: done
updated: 2026-08-13
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: 6477
claim: "2026-08-13T16:45:43Z"
assignee: "fold-grouped-composite-assoc-into-one-grouped-body"
blocked-by: null
closed-reason: null
---

## Context

PR #6460 ported `Minitest::UnexpectedError` into
`packages/activesupport/src/testing/assertions.ts` so `assert_nothing_raised`
(assertions.rb:49-53) has the class Rails raises and
`_assert_nothing_raised_or_warn` (assertions.rb:281-294) has the class it
rescues.

Minitest defines `message` and `backtrace` as METHODS that read the wrapped
error when called (minitest-6.0.6 lib/minitest.rb:1097-1107):

```ruby
def backtrace
  self.error.backtrace
end

def message
  bt = Minitest.filter_backtrace(self.backtrace).join("\n    ")
    .gsub(BASE_RE, "")
  "#{self.error.class}: #{self.error.message}\n    #{bt}"
end
```

trails composes both strings once in the constructor, so a wrapped error whose
`message` or `stack` is mutated after the wrap renders stale, and the
`Minitest.filter_backtrace` / `BASE_RE` cwd-stripping steps are dropped
entirely — the raw `stack` goes in unfiltered, which makes the failure text much
noisier than Rails'.

## Converged shape

Make `message` and `stack` getters that read `this.error` at call time, and port
the backtrace filtering (`Minitest.filter_backtrace` plus the `Dir.pwd` prefix
strip) so the rendered trace matches Rails' shape. Note `Error#message` and
`Error#stack` are own data properties on a constructed `Error`, so the getters
have to be defined on the prototype and the constructor must not assign the
instance fields that would shadow them.

## Acceptance criteria

- [ ] `UnexpectedError#message` / `#stack` read the wrapped error at call time.
- [ ] The backtrace is filtered and cwd-relative, matching minitest.rb:1101-1107.
- [ ] A test mutates the wrapped error after wrapping and asserts the rendered
      message follows.
