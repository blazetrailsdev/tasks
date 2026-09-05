---
title: "Dir::Tmpname.create's date stamp is UTC where tmpdir.rb:153 uses Time.now local time"
status: in-progress
updated: 2026-09-05
rfc: "0135-platform-adapters-in-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 35
pr: 7521
claim: "2026-09-05T16:00:46Z"
assignee: "copy-entry-drops-dereference-root-and-remove-destination"
blocked-by: null
closed-reason: null
---

## Context

`Dir::Tmpname.create` stamps a candidate name with the LOCAL date
(`vendor/ruby/lib/tmpdir.rb:153`):

```ruby
t = Time.now.strftime("%Y%m%d")
```

`Time.now` is local time, so the stamp rolls over at local midnight.
`packages/ruby-compat/src/tempfile.ts`'s `createTmpname` uses UTC and flags it
as a boundary:

```ts
/* boundary: `Time.now.strftime("%Y%m%d")` (`vendor/ruby/lib/tmpdir.rb:153`)
   — the stamp is local-time in Ruby and UTC here. */
const t = new Date().toISOString().slice(0, 10).replace(/-/g, "");
```

The stamp is decoration inside a name that is already randomised and
retried on `Errno::EEXIST`, so nothing breaks — but a trails tempfile created
at 23:00 in a UTC+2 zone is named with tomorrow's date where Ruby's is named
with today's, which is visible to anyone reading a temp directory and is a
gratuitous divergence in a body that is otherwise line-for-line.

## Converged shape

Format the local date rather than the UTC one. `new Date()` already holds the
local value; the UTC arrives only from `toISOString()`. Use the local
year/month/day components zero-padded to `%Y%m%d`, which is what
`strftime("%Y%m%d")` produces.

Note the repo has a `date` package and a `TimeWithZone`; this is deliberately
NOT a reason to reach for either — `ruby-compat` is a leaf (README §4) and
`Dir::Tmpname` calls plain `Time.now`, so the plain local-date read is the
faithful shape.

## Acceptance criteria

- `createTmpname`'s stamp is the LOCAL date, matching `tmpdir.rb:153`.
- The `boundary:` comment is deleted rather than reworded.
- `ruby-compat` still imports nothing from the workspace.
