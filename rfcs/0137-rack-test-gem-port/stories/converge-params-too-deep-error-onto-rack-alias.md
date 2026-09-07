---
title: "ParamsTooDeepError is a subclass where Rack aliases it to QueryLimitError"
status: draft
updated: 2026-09-07
rfc: "0137-rack-test-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rack makes `ParamsTooDeepError` an **alias** of `QueryLimitError`, and the
comment above it says why:

```ruby
# ParamsTooDeepError is the old name for the error that is raised when params
# are recursively nested over the specified limit. Make it the same as
# as QueryLimitError, so that code that rescues ParamsTooDeepError error
# to handle bad query strings also now handles other limits.
ParamsTooDeepError = QueryLimitError    # vendor/rack/lib/rack/query_parser.rb:34
```

trails declares it as a **subclass** instead
(`packages/rack/src/query-parser.ts`):

```ts
export class ParamsTooDeepError extends QueryLimitError {
  constructor(message: string) {
    super(message);
    this.name = "ParamsTooDeepError";
  }
}
```

The subclass inverts the containment the alias exists to give. In Rack,
`rescue ParamsTooDeepError` catches every `QueryLimitError` because they are
the same constant — that is the documented point. In trails, a thrown
`QueryLimitError` is NOT an instance of `ParamsTooDeepError`, so a caller
that still catches the old name silently stops catching the newer limits:
exactly the breakage the upstream comment says the alias prevents.

`packages/rack/src/utils.ts` re-exports the name, so the alias arm is
user-visible surface, not an internal detail.

Surfaced in #7581 while mixing `BadRequest` into the `query_parser.rb`
error family. That PR added `include(QueryLimitError, BadRequest)` at
`query_parser.rb:26`'s site and deliberately did not add a sibling call for
`ParamsTooDeepError`, because Rack has no second `include` there — which is
what put the subclass/alias split in front of the author.

## Converged shape

`export const ParamsTooDeepError = QueryLimitError;` — one constant, two
names, as `query_parser.rb:34` has it. Check the `name` property
expectations first: the subclass currently sets `this.name =
"ParamsTooDeepError"`, and an alias reports `"QueryLimitError"`, which is
also what Ruby reports for the aliased constant.

## Acceptance criteria

- [ ] `ParamsTooDeepError` is an alias of `QueryLimitError`, mirroring
      `query_parser.rb:34`; the subclass is gone.
- [ ] A test pins the containment the alias buys — a thrown `QueryLimitError`
      is caught by `ParamsTooDeepError` and vice versa.
- [ ] `packages/rack/src/utils.ts`'s re-export still resolves.
- [ ] `pnpm parity:api` deltas non-negative; `parity:api:extra:gate` OK.
