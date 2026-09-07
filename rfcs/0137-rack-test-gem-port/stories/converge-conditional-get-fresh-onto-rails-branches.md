---
title: "ConditionalGet#fresh splits one Rails elsif into two nested ifs and renames the local"
status: draft
updated: 2026-09-07
rfc: "0137-rack-test-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rack::ConditionalGet#fresh?` (`vendor/rack/lib/rack/conditional_get.rb:51-58`)
is a two-arm `if`/`elsif` whose second arm reassigns the local while testing it:

```ruby
def fresh?(env, headers)
  # if-none-match has priority over if-modified-since per RFC 7232
  if none_match = env['HTTP_IF_NONE_MATCH']
    etag_matches?(none_match, headers)
  elsif (modified_since = env['HTTP_IF_MODIFIED_SINCE']) && (modified_since = to_rfc2822(modified_since))
    modified_since?(modified_since, headers)
  end
end
```

trails' `fresh` (`packages/rack/src/conditional-get.ts`) restructures it into a
third nesting level with a renamed local and an explicit `false`:

```ts
const modifiedSince = env["HTTP_IF_MODIFIED_SINCE"];
if (modifiedSince) {
  const parsed = this.toRfc2822(modifiedSince);
  if (parsed) {
    return this.modifiedSince(parsed, headers);
  }
}
return false;
```

Three deviations, none language-forced:

- Rails' single `elsif` guard becomes two nested `if`s — one Rails branch split
  into two.
- The parsed value keeps the Rails identifier `modified_since` in Ruby (the
  `elsif` reassigns the same local); trails introduces `parsed`.
- Ruby's `if`/`elsif` with no `else` returns `nil` when neither arm matches;
  trails returns `false` and types `fresh` as `boolean`. `#call`'s
  `status == 200 && fresh?(...)` treats both the same, so this one is
  behaviourally inert — but it is still a return-value deviation of the kind
  CLAUDE.md's "Predicates" note is about.

Surfaced while porting `Time.rfc2822` behind `to_rfc2822` in #7585, which
converged `to_rfc2822`, `modified_since?` and `#call` in this file but left
`fresh?`'s own shape alone as out of scope.

## Converged shape

One `if`/`else if` chain matching `conditional_get.rb:53-57`, with the assign-in-
condition of the second arm spelled the TS way and the Rails local name kept:

```ts
const noneMatch = env["HTTP_IF_NONE_MATCH"];
if (noneMatch) {
  return this.isEtagMatches(noneMatch, headers);
}
let modifiedSince = env["HTTP_IF_MODIFIED_SINCE"];
if (modifiedSince && (modifiedSince = this.toRfc2822(modifiedSince))) {
  return this.modifiedSince(modifiedSince, headers);
}
```

Check whether the `nil` return can be kept (`boolean | undefined`) before
settling for `false`; `#call` is the only caller.

## Acceptance criteria

- [ ] `fresh` is two branches, not three, mirroring `conditional_get.rb:53-57`.
- [ ] The parsed value carries the Rails identifier `modifiedSince`, not
      `parsed`.
- [ ] The absent-`else` return is reconciled with Ruby's `nil` or the deviation
      is cited at the call site.
- [ ] `packages/rack/src/conditional-get.test.ts` and
      `conditional-get.trails.test.ts` stay green with no test name reworded.
- [ ] Both call gates green with no new baseline rows.
