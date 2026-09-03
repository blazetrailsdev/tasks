---
title: "Instrumentation#process_action's rescue arm must resolve error.class.name, not constructor.name"
status: draft
updated: 2026-09-03
rfc: "0129-ruby-compat"
cluster: null
packages: []
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

`ActionController::Instrumentation#process_action`'s rescue arm passes
`error.class.name` to `status_code_for_exception`
(`vendor/rails/actionpack/lib/action_controller/metal/instrumentation.rb:81-83`):

```ruby
rescue => error
  payload[:status] = ActionDispatch::ExceptionWrapper.status_code_for_exception(error.class.name)
  raise
```

`error.class.name` in Ruby is the fully-qualified constant, e.g.
`"ActionDispatch::Http::Parameters::ParseError"`. The port, landed by #7441 at
`packages/actionpack/src/action-controller/metal/instrumentation.ts:57-59`,
reads:

```ts
payload.status = ExceptionWrapper.statusCodeForException(
  (error as Error)?.constructor?.name ?? String(error),
);
```

`constructor.name` is the JS _class_ identifier, not the Rails-qualified
constant. `STATUS_MAP` in
`packages/actionpack/src/action-dispatch/middleware/exception-wrapper.ts:16-39`
is keyed by the qualified spellings for the ParseError/ParamError family
(`"ActionDispatch::ParamError"`, `"ActionDispatch::Http::Parameters::ParseError"`,
…), which trails error classes carry on `.name`, not on `constructor.name`. So
every such error silently falls through `statusCodeFor`'s `?? 500`
(`exception-wrapper.ts:272-274`) and the payload reports 500 where Rails maps 400.

`exception-wrapper.ts:78-83` already has the correct JS analogue of
`exception.class.name` as a module-private `classNameOf` — prefer `e.name`,
fall back to `constructor.name`, treat the inherited `"Error"` as unset.

## Converged shape

Export `classNameOf` (it is the JS analogue of a Ruby construct with no
TS equivalent, so it carries `@noRailsEquivalent PERMANENT`) and call it:

```ts
import {
  ExceptionWrapper,
  classNameOf,
} from "../../action-dispatch/middleware/exception-wrapper.js";
...
payload.status = ExceptionWrapper.statusCodeForException(classNameOf(error as Error));
```

## Acceptance criteria

- The rescue arm resolves the class name the way Ruby's `error.class.name`
  does, so a `STATUS_MAP` entry keyed by a Rails-qualified name is found.
- A test drives an action that throws an error whose `.name` is a qualified
  constant in `STATUS_MAP` (e.g. `"ActionDispatch::ParamError"` -> 400) and
  asserts `payload.status`. It must FAIL against the current
  `constructor.name` lookup — verified: it reports 500 before the change and
  400 after.
- No other call site is switched to `constructor.name`; if `classNameOf` is
  exported, its receipt is `PERMANENT`.

## Notes

PR #7441's review raised this (finding 2) and a fix was written and verified
locally, but the PR merged before it was committed, so main carries the bug.
The same review noted (finding 5) that no test drove the rescue arm at all —
that gap is why the bug shipped, and the test above closes both.
