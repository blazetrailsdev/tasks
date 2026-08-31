---
title: "ActionView date helpers reject the Temporal.Instant ActiveRecord returns for datetime columns"
status: in-progress
updated: 2026-08-31
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: ["actionview", "activerecord"]
deps: []
deps-rfc: []
est-loc: 60
priority: 19
pr: 7310
claim: "2026-08-31T19:31:24Z"
assignee: "require-application-probes-dist-instead-of-app-path"
blocked-by: null
closed-reason: null
---

## Context

ActiveRecord hands back a `Temporal.Instant` for a datetime column, and
ActionView's date helpers do not accept one, so the two halves of the stack
cannot be composed without a manual conversion.

Observed in `examples/twitter-app` against a `tweets.created_at`:

```text
typeof: object | ctor: Instant
value: 2026-08-13T20:38:25.539505Z
```

Passing that straight to `timeAgoInWords` raises
`... can't be converted to a Time value`, because
`packages/actionview/src/helpers/date-helper.ts:30` declares

```ts
export type DistanceOfTimeInput = Date | number | { toDate: () => Date } | { toTime: () => Date };
```

`Temporal.Instant` answers none of those — it exposes `epochMilliseconds` and
`toString()`.

Rails has no seam here: an AR datetime reads back as
`ActiveSupport::TimeWithZone`, and `distance_of_time_in_words` normalizes it
through `.to_time`
(`actionview/lib/action_view/helpers/date_helper.rb`, `distance_of_time_in_words`
calling `normalize_distance_of_time_argument_to_time`), so
`time_ago_in_words(post.created_at)` just works.

`examples/twitter-app` converts by hand in
`src/app/controllers/application-controller.ts#timeAgo`, reading
`epochMilliseconds` and rebuilding a `Date`.

## Converged shape

Either `DistanceOfTimeInput` accepts the type ActiveRecord actually returns
(add `Temporal.Instant`, or a `{ epochMilliseconds: number }` structural arm
to `normalizeDistanceOfTimeArgumentToTime`), or AR's datetime type grows the
`toDate()` / `toTime()` the helper already probes for — the latter also fixes
every other helper that takes a time.

## Acceptance criteria

- `timeAgoInWords(record.created_at)` works with no conversion at the call
  site, for a datetime column on all three adapters.
- A test passes an AR-loaded timestamp straight into the date helpers.
- `examples/twitter-app` drops `timeAgo`'s conversion and its `TODO`.
