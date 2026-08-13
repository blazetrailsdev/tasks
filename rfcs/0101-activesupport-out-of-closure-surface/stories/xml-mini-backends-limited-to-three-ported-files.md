---
title: "XmlMini resolves only 3 of Rails' 6 backend files by name"
status: done
updated: 2026-08-13
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 6495
claim: "2026-08-13T21:57:10Z"
assignee: "converge-fixtures-encrypted-attributes-present"
blocked-by: null
closed-reason: null
---

## Context

`cast_backend_name_to_module` (`vendor/rails/activesupport/lib/active_support/xml_mini.rb:200-206`)
is `require "active_support/xml_mini/#{name.downcase}"` + `const_get`, so in Ruby
it reaches **every** file under `active_support/xml_mini/`: `jdom.rb`, `libxml.rb`,
`libxmlsax.rb`, `nokogiri.rb`, `nokogirisax.rb`, `rexml.rb`.

trails has only three of the six (`packages/activesupport/src/xml-mini/`:
`rexml.ts`, `nokogiri.ts`, `nokogirisax.ts`). PR #6481 replaced the interpolated
dynamic import with one literal `import()` per existing file — the interpolated
form is unresolvable under vitest, which globs `./xml-mini/*.js` against `.ts`
sources — so the reachable set is now spelled out in a `switch` at
`packages/activesupport/src/xml-mini.ts` (`castBackendNameToModule`), with unknown
names raising the message Ruby's `LoadError` carries.

Two consequences worth converging:

- `XmlMini.backend = "LibXML"` / `"LibXMLSAX"` / `"JDOM"` raises where Rails
  resolves a module. `packages/activesupport/src/xml-mini/jdom-engine.test.ts` is
  already present and fully skipped for this reason.
- The switch is a hand-maintained mirror of a directory listing: porting a backend
  now requires adding its `case`, and nothing fails if you forget.

## Acceptance criteria

- [ ] The remaining backends Rails ships are ported to
      `packages/activesupport/src/xml-mini/<name>.ts` (or the ones trails will not
      carry are named, with the reason, in one place rather than implied by an
      absent `case`).
- [ ] `castBackendNameToModule`'s reachable set matches the ported files — adding a
      backend file without a `case` should not be silently possible.
- [ ] `jdom-engine.test.ts` is unskipped if JDOM lands.
