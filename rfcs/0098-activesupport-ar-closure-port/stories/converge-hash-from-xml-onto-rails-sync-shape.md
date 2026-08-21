---
title: "Converge Hash.from_xml and XMLConverter onto Rails' synchronous shape"
status: claimed
updated: 2026-08-21
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: "2026-08-21T16:20:37Z"
assignee: "converge-habtm-through-model-lazy-table-name"
blocked-by: null
closed-reason: null
---

## Context

`Hash.from_xml` / `Hash.from_trusted_xml` returned a `Promise` when ported in
trails#6818, where Rails returns the Hash directly
(`vendor/rails/activesupport/lib/active_support/core_ext/hash/conversions.rb:128-135`):

```ruby
def from_xml(xml, disallowed_types = nil)
  ActiveSupport::XMLConverter.new(xml, disallowed_types).to_h
end
```

The async-ness comes from `XmlMini.parse`, which trails declares awaitable
because `XmlMiniBackend#parse` is (`packages/activesupport/src/xml-mini.ts`,
`delegate :parse, to: :backend`, xml_mini.rb:99). That in turn forced a second
deviation: `XMLConverter` cannot do Rails' `initialize` work in its constructor
(a TS constructor cannot await), so trails added a `static create` factory
carrying an `@noRailsEquivalent PERMANENT` tag
(`packages/activesupport/src/core-ext/hash/conversions.ts`).

Both deviations are downstream of one question nobody has checked: **does
`parse` actually need to be async?** The default REXML backend
(`packages/activesupport/src/xml-mini/rexml.ts`) is pure JS over
`packages/activesupport/src/rexml/document.ts` — it awaits nothing. If the
backend seam can be sync (or sync-with-async-escape for a backend that needs
it), all three members collapse onto their Rails shapes.

## Converged shape

`XmlMini.parse` is sync for the REXML backend; `XMLConverter`'s constructor does
`@xml = normalize_keys(XmlMini.parse(xml))` exactly as conversions.rb:151-154,
the `static create` factory and its `@noRailsEquivalent` tag are deleted, and
`Hash.from_xml` / `from_trusted_xml` return the Hash rather than a Promise.

If a non-REXML backend genuinely requires async, converge as far as the default
path allows and keep the residue to one tagged seat rather than three.

## Acceptance criteria

- [ ] `Hash.from_xml` / `Hash.from_trusted_xml` mirror conversions.rb:128-135,
      returning the Hash (not a Promise), for the default backend.
- [ ] `XMLConverter`'s constructor mirrors conversions.rb:151-154; `static
create` and its `@noRailsEquivalent` tag are gone.
- [ ] Callers updated; `pnpm parity:api:extra` clean.
- [ ] `pnpm parity:api:calls` / `:args` green with no new baseline rows.
