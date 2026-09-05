---
title: "Make assertions.ts default messages lazy so inspect never runs on a passing assertion"
status: draft
updated: 2026-09-05
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #7519 while porting `Rack::Test::Session#follow_redirect!`. A
ported test asserting `last_request.GET.must_be_empty`
(`vendor/rack-test/spec/rack/test_spec.rb:444-448`) failed with
`TypeError: Cannot convert object to primitive value` even though the hash WAS
empty — costing a debug cycle chasing a non-existent `URI#merge` bug.

The cause is in `packages/activesupport/src/testing/assertions.ts`: the default
message is a template literal in the argument position, so JS evaluates it on
every call, pass or fail.

```ts
export function assertEmpty(actual: unknown, message?: string): void {
  assert(collectionSize(actual) === 0, message ?? `Expected ${inspect(actual)} to be empty`);
}
```

`inspect` (`assertions.ts:446-450`) then does a bare `String(value)`, which
throws for a null-prototype object — which is exactly what `Rack::Request#GET`
returns. So a passing assertion raised.

Ruby has no equivalent exposure: Minitest's `assert_empty` builds its message
through a block (`msg = message(msg) { ... }`), so the formatting never runs on
the passing path.

PR #7519 patched `inspect` to fall back instead of throwing, which stops the
crash. It does **not** fix the eager evaluation, and every other helper in the
file still formats an inspect string for every passing assertion:
`assertEmpty`, `assertNotEmpty`, `assertRespondTo`, `assertNotRespondTo`,
`assertSame`, `assertNotSame` — and any sibling added later inherits the shape.

## Converged shape

Take the default message lazily, as Minitest's block-taking `message(msg) { }`
does — a thunk (`message?: string | (() => string)`) resolved inside `assert`
only on the failing branch, so `inspect` never runs on a passing assertion.
These helpers are already `@noRailsEquivalent PERMANENT` trails surface, so the
signature is ours to choose; the point is matching Minitest's laziness, not its
spelling.

## Acceptance criteria

- [ ] No `assert*` helper in `packages/activesupport/src/testing/assertions.ts`
      evaluates its default message on the passing path.
- [ ] A regression test asserts that a passing `assertEmpty` over a
      null-prototype object neither throws nor calls `inspect`. It must fail on
      the pre-change baseline.
- [ ] The `inspect` try/catch added in #7519 stays — it is a second, independent
      guard, not the fix this story replaces.
