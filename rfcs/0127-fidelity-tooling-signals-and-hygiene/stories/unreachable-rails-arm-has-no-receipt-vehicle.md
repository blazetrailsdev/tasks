---
title: "unreachable-rails-arm-has-no-receipt-vehicle"
status: draft
updated: 2026-09-06
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

A Rails branch that is faithfully ported but **unreachable in TypeScript** has
no receipt vehicle. Both candidates are rejected by the repo's own gates —
verified on #7565, which ported `write_query?`'s `rescue ArgumentError` arm:

```ruby
def write_query?(sql) # :nodoc:
  !READ_QUERY.match?(sql)
rescue ArgumentError # Invalid encoding
  !READ_QUERY.match?(sql.b)
end
```

(`activerecord/lib/active_record/connection_adapters/postgresql/database_statements.rb:24-28`,
`.../mysql/database_statements.rb:17-21`, `.../sqlite3/database_statements.rb:12-16`.)

Ruby raises the `ArgumentError` from `Regexp#match?` for a String whose bytes
are not valid in its encoding. A JS string is always a valid UTF-16 sequence, so
`RegExp.prototype.test` never throws for one and the catch arm is unreachable
for every real caller.

1. `/** @missingRailsCall b — PERMANENT */` at the call site →
   `call-mismatches ratchet: STALE @missingRailsCall tag(s) whose call is no
longer flagged`. `b` is not in `write_query?`'s flagged call set, so there is
   nothing to suppress and the ratchet reds. True of the un-ported one-line body
   too, so it is not an artefact of porting.
2. A prose note at the call site →
   `error blazetrails/no-freeform-comments: English-language comment`.
   `KEPT_TAG_NAMES` (`eslint/no-freeform-comments.mjs:107`) is
   `internal|noRailsEquivalent|missingRailsCall|missingRailsArgs|empty|deprecated`,
   and every one keeps only its permanence token — the English and the Rails
   cite are discarded by `renderTag`.

So the branch ships correct and undocumented, and the next reader has no
in-file signal that the arm is deliberately dead rather than accidentally so.
The story's own acceptance criterion ("the decision is written down at the call
site") was unsatisfiable for this reason.

The repo already has a precedent for a directive that survives the comment
sweep: `abstract/database-statements.ts:957` carries
`// @nie disposition=keep-as-strategy-hook rails=.../database_statements.rb:118`.
That shape is the model — a machine-readable tag with a Rails cite — but `@nie`
is specific to `NotImplementedError` and does not cover an unreachable arm.

## Converged shape

A receipt tag for a ported-but-unreachable Rails branch, carrying a Rails cite
and a permanence token, e.g.

```ts
/** @unreachableRailsArm rescue ArgumentError — PERMANENT rails=activerecord/lib/active_record/connection_adapters/postgresql/database_statements.rb:26 */
```

kept by `no-freeform-comments` (added to `KEPT_TAG_NAMES` and given a
`renderTag` arm that preserves the `rails=` cite the way `@nie` does), and inert
in the call ratchets rather than STALE.

## Acceptance criteria

- A tag exists that documents an unreachable-but-ported Rails branch at the call
  site, survives `blazetrails/no-freeform-comments`, and reds no call gate.
- The Rails `file:LINE` cite survives `renderTag` rather than being stripped as
  prose.
- The three `isWriteQuery` arms landed by #7565 (postgresql, mysql, sqlite3
  `database-statements.ts`) carry it.
- `pnpm parity:api:calls` and `pnpm lint` stay clean.
