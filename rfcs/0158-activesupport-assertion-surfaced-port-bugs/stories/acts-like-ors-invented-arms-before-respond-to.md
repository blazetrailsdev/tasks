---
title: "actsLike ORs actsLikeTime/Date/String arms in front of Rails' bare respond_to?"
status: draft
updated: 2026-09-25
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
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

Surfaced by trails#8079 (converge-object-acts-like-to-this-typed-function). Rails'
`Object#acts_like?` (`vendor/rails/activesupport/lib/active_support/core_ext/object/acts_like.rb:33-44`)
is a bare `respond_to?` per duck: `respond_to? :acts_like_time?`, `:acts_like_date?`,
`:acts_like_string?`, else `:"acts_like_#{duck}?"`.

trails' `actsLike` (`packages/activesupport/src/core-ext/object/acts-like.ts`) ORs an extra
arm in front of each known duck: `actsLikeTime(this) ||`, `actsLikeDate(this) ||`,
`actsLikeString(this) ||` (from `@blazetrails/date` / `core-ext/string/behavior.ts`). Those
answer for JS primitives and Temporal values that carry no `actsLikeTime()` method. Its
`respondTo` helper also camelCases the Ruby name by hand instead of going through
`rbObjRespondTo`.

## Converged shape

`actsLike` is the Rails body: one `rbObjRespondTo(this, "acts_like_time?")`-style probe per
branch. The receivers that must answer (String, Temporal stand-ins, Time, Date,
TimeWithZone) answer through their own `actsLikeX()` members, the way Rails' `String`,
`Time` and `Date` each define `acts_like_*?` (`core_ext/string/behavior.rb`,
`core_ext/time/acts_like.rb`, `core_ext/date/acts_like.rb`).

## Acceptance criteria

- `actsLike` has no arm beyond `respond_to?`.
- Every current caller keeps its answer. Receivers without the member gain it, following the Rails file it mirrors.
