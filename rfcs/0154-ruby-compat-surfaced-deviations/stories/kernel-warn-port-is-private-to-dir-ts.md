---
title: "Kernel#warn port is private to dir.ts; assertions.ts re-inlines it without uplevel"
status: draft
updated: 2026-09-23
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: ["ruby-compat", "activesupport"]
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#7998. ruby-compat's port of `Kernel#warn` (`rb_warn_m`,
`vendor/ruby/error.c:555-573`) is a module-private `warn` in
`packages/ruby-compat/src/dir.ts`. Callers elsewhere cannot reach it, so
`assertEqual` in `packages/activesupport/src/testing/assertions.ts` re-inlines
its body (`if (verbose() != null) stderr.write(…)`) for Minitest's
`warn "DEPRECATED: Use assert_nil if expecting nil…", uplevel: _caller_uplevel`
(`vendor/minitest/lib/minitest/assertions.rb` `assert_equal`), and drops the
`uplevel:` keyword (which prefixes `path:line: warning:`).

## Converged shape

One exported `Kernel#warn` port in ruby-compat (receipted like the other Ruby
core ports), taking `uplevel`, used by both `dir.ts` and `assertions.ts`.

## Acceptance criteria

- [ ] `dir.ts` and `assertions.ts` call the same `warn`.
- [ ] `uplevel:` is honoured or its omission is receipted at the call site.
