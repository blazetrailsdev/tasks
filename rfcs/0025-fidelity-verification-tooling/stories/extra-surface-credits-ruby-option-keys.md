---
title: "Ruby option-hash keys count as Ruby-side names for extra-surface"
status: closed
updated: 2026-08-17
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Superseded by credit-ruby-hash-and-option-keys-as-ruby-surface (2026-08-17 sweep): same root cause as extra-surface-scores-ruby-hash-keys-as-novel. json/encoding.ts re-measured at exactly 1 novel (escapeHtmlEntities); citations carried forward."
---

## Context

Surfaced by PR #6134 (`activesupport-json-encoding-jsongemencoder-port`).

`pnpm parity:api:extra --package activesupport` reports one novel name on
`packages/activesupport/src/json/encoding.ts`: `escapeHtmlEntities`, a field on
the `EncodeOptions` interface.

The name is not invented. It is Rails' own option key, read at
`vendor/rails/activesupport/lib/active_support/json/encoding.rb:62`:

```ruby
if @options.fetch(:escape_html_entities, Encoding.escape_html_entities_in_json)
```

and documented as a public option on `ActiveSupport::JSON.encode`
(`encoding.rb:34-37`). The ported test `hash keys encoding option`
(`packages/activesupport/src/json/encoding.test.ts`, from
`vendor/rails/activesupport/test/json/encoding_test.rb:62-72`) exercises it.

The extractor scores _declaration names_ — Ruby method names, constants, and
class/module names. A Ruby Symbol used as an options-hash key is none of those,
so `escape_html_entities` never enters the Ruby-side allowed set and its faithful
TS spelling reads as drift. This is the same class of extractor blind spot as
`initialize` on a prepended module (fixed in #6134 via `SCOPED_SKIP_GROUPS` +
`tsMirrorName`): a real Rails name with no counterpart at the site the extractor
looks at.

It was left counted rather than tagged, deliberately — a `@noRailsEquivalent`
would assert the name is not Rails', which is false, and per #5342 a tag is for
irreducible surface only.

parity:api already extracts option keys for its own advisory comparison
(`Option keys (advisory): N pairs compared` in the summary, written to
`output/options-key-mismatches.json`), so the Ruby-side data may already exist
and only need feeding into the extra-surface allowed set.

## Converged shape

An option key a Ruby method reads out of an options hash counts as a Ruby-side
name for extra-surface purposes, so its camelCased TS spelling — whether declared
on an options interface or as a destructured parameter — scores as allowed rather
than novel. `escapeHtmlEntities` on `json/encoding.ts` drops out of the novel
count with no tag added.

## Acceptance criteria

- [ ] Identify whether the option-key extraction behind
      `output/options-key-mismatches.json` already yields the Ruby-side keys per
      method/file; reuse it rather than adding a second extraction path.
- [ ] Ruby option keys feed `collectAllowedNames` (`scripts/api-compare/extra-surface.ts`)
      so their camelCased TS spellings score as allowed.
- [ ] Scoped to the file whose Ruby counterpart reads the key — a key read in
      `json/encoding.rb` must not silence the same name in an unrelated file,
      mirroring how `isScopedSkip` / `scopedSkipMirrorName` are file-scoped.
- [ ] `pnpm parity:api:extra --package activesupport` reports 0 novel for
      `json/encoding.ts`, with no `@noRailsEquivalent` tag added anywhere.
- [ ] Covered by a test in `scripts/api-compare/` (the existing
      `extra-surface.test.ts` is the natural home).
- [ ] Record the activesupport and activerecord novel deltas — this may clear
      option-key false positives well beyond the one that surfaced it.
