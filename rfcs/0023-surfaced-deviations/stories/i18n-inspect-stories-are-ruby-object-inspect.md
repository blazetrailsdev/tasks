---
title: "i18n-inspect-stories-are-ruby-object-inspect"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Not Rails-convergent: an RFC-bookkeeping meta story (decide where four OTHER stories should live). No code divergence of its own; the corelib/inspect anchoring decision belongs to whichever RFC owns corelib enrollment."
---

## Context

RFC `0074-i18n-parity` carries four `inspect` stories:

- `i18n-inspect-string-ruby-escapes`
- `i18n-inspect-string-nonprintable-unicode`
- `i18n-inspect-hash-ruby-rendering`
- `i18n-inspect-namespaced-class-name`

These are Ruby `Object#inspect` / `String#inspect` / `Hash#inspect` semantics —
**core-language rendering, not i18n gem behavior.** `vendor/i18n/lib/i18n/` has no
`inspect` implementation; the gem inherits Ruby's. They sit in the i18n RFC
because that is where the need surfaced (exception message rendering, e.g.
`packages/i18n/src/backend/base.ts:363`'s
`` `Object must be a Date, DateTime or Time object. ${inspect(object)} given.` ``),
not because they belong to i18n.

This is the same anchoring problem the `0088-date-gem-port` audit found for
`Date`/`Time`/`Range`/`String#succ`: ported Ruby core with no vendored counterpart,
so `parity:api` cannot resolve it and no gate can go green.

**Flagged deliberately rather than moved.** The corelib RFC scoped itself to
Date/DateTime/Time, Range core, and the module-mixin primitives, and explicitly
excluded `inspect` to avoid scope sprawl — the main risk identified for that
package. This story records the finding so it is not re-derived, and schedules the
decision for after corelib's enrollment stories land and the pattern is proven.

## Acceptance criteria

- [ ] Confirm the four stories' current status in RFC 0074 (some may be done).
- [ ] Decide whether `inspect` moves to `packages/corelib` in a later wave, and
      whether `ruby/spec`'s `core/string/inspect_spec.rb` +
      `core/hash/inspect_spec.rb` are a sufficient anchor.
- [ ] If yes: file the move as a corelib story with the `file:line` set from this
      story; do **not** widen the corelib RFC's current scope retroactively.
- [ ] If no: record why `inspect` is different from `succ` — both are Ruby core
      with no Rails file — so the distinction is defensible rather than arbitrary.
- [ ] Do not ratify: "leave it unanchored in i18n" is not an outcome; either it
      moves or it gets an anchor where it is.
