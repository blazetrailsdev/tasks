---
title: "serializeTimeValue is invented surface with no Rails member and no caller"
status: done
updated: 2026-08-21
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 6799
claim: "2026-08-21T00:17:06Z"
assignee: "converge-date-type-cast-for-schema-to-rails"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while making `Helpers::TimeValue` a real mixin in PR #6788.

`packages/activemodel/src/type/helpers/time-value.ts` exports

```ts
export function serializeTimeValue(value: unknown): string | null;
```

which has no counterpart anywhere in
`vendor/rails/activemodel/lib/active_model/type/helpers/time_value.rb:9-95` —
that module's members are `serialize_cast_value`, `apply_seconds_precision`,
`type_cast_for_schema`, `user_input_in_time_zone`, `new_time` and
`fast_string_to_time`, all of which the module object now carries. It is also
dead: a repo-wide grep finds no caller outside the file's own `dist/` artifact,
and it is not a member of the exported `TimeValue` module.

It predates this PR and was left alone to keep that story scoped.

## Converged shape

Deleted. A Rails-shaped helper file exports the module's members and nothing
else; a `Temporal`-to-string helper with no Ruby counterpart and no caller is
exactly the extra surface `parity:api:extra` measures.

Check for downstream importers before deleting (it is a public export of the
`activemodel` barrel); if one turns up, it is answering a Rails member under a
non-Rails name and should be routed to that member instead.

## Acceptance criteria

- [ ] `serializeTimeValue` is gone from `type/helpers/time-value.ts`.
- [ ] `pnpm parity:api:extra --package activemodel` shrinks by one, or is
      unchanged if the name was never counted.
- [ ] activemodel `type/**` tests stay green.
