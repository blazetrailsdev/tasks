---
title: "composite-key-record-not-found-ids-do-not-render-as-ruby-join"
status: draft
updated: 2026-08-31
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 130
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while scoping `inline-ruby-bodies-extracted-as-named-helpers` in
PR #7306. That story asks for `raiseNotFoundAll` / `raiseNotFoundSingle`
(`packages/activerecord/src/relation/finder-methods.ts:95,146`) to fold into the
already-ported `raiseRecordNotFoundExceptionBang` (`:589`), which is a faithful
port of `raise_record_not_found_exception!`
(`vendor/rails/activerecord/lib/active_record/relation/finder_methods.rb:420-435`).
They cannot fold cleanly today, because the two paths render a COMPOSITE-key id
list differently — and neither spelling matches Rails.

Rails builds the "found N results" arm as
(`finder_methods.rb:430-431`):

```ruby
error = +"Couldn't find all #{name.pluralize} with '#{key}': "
error << "(#{ids.join(", ")})#{conditions} (found #{result_size} results, but was looking for #{expected_size})."
```

For a composite key the `ids` are tuples, and Ruby's `Array#join` FLATTENS
nested arrays. Verified against MRI on this box:

```console
ruby -e 'p [[1,2],[3,4]].join(", ")'   # => "1, 2, 3, 4"
```

The two TS spellings both diverge from that:

- `raiseNotFoundAll` uses `String(tuples)` → `"1,2,3,4"` (no spaces)
- `raiseRecordNotFoundExceptionBang` uses `wrap(ids).join(", ")`, and JS
  `Array#join` stringifies each nested element rather than flattening →
  `"1,2, 3,4"`

So the fold cannot be done as a pure deletion: whichever survives, the composite
message changes, and both are wrong against Rails. This is the blocker that kept
`finder-methods.ts` out of PR #7306.

## Converged shape

Render the id list the way Ruby's `Array#join` does — flatten, then join with
`", "` — in `raiseRecordNotFoundExceptionBang`, so a composite key produces
`(1, 2, 3, 4)` exactly as `finder_methods.rb:431` does. With the rendering
converged, `raiseNotFoundAll` and `raiseNotFoundSingle` become plain duplicates
of that method's third and second arms and can be deleted, their call sites in
`performFind` (`finder-methods.ts:260,273,279`) calling
`this.raiseRecordNotFoundExceptionBang(...)` as Rails' `find_one` / `find_some`
do (`finder_methods.rb:536,551`).

Check whether a repo-wide Ruby-`join` helper already exists before adding one;
if not, keep the flatten local to the message rather than inventing surface.

## Acceptance criteria

- A composite-key `RecordNotFound` message renders its ids as
  `finder_methods.rb:431` does — flattened, `", "`-joined — verified against
  MRI, not against the current TS string.
- `raiseNotFoundAll` and `raiseNotFoundSingle` are deleted along with their
  `@noRailsEquivalent CONVERGEABLE inline-ruby-bodies-extracted-as-named-helpers`
  receipts; `performFind` routes through `raiseRecordNotFoundExceptionBang`.
- Any assertion in `finder-methods.trails.test.ts` pinning the OLD composite
  string is updated to the Rails rendering — the message is the thing being
  fixed, so a test pinning the divergence is not evidence against the change.
- Composite-primary-key finder suites stay green on all three adapters.
- `pnpm parity:api:extra --package activerecord` novel count strictly drops.
