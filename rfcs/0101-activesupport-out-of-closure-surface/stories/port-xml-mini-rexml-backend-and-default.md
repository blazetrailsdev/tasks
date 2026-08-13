---
title: "port-xml-mini-rexml-backend-and-default"
status: done
updated: 2026-08-13
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6449
claim: "2026-08-13T01:16:48Z"
assignee: "port-xml-mini-rexml-backend-and-default"
blocked-by: null
closed-reason: null
---

## Context

`port-xml-mini-backend-and-parsing-half` (PR landing the backend/parse half of
`packages/activesupport/src/xml-mini.ts`) left two pieces of `xml_mini.rb`
unported, both of which need `XmlMini_REXML`:

- `vendor/rails/activesupport/lib/active_support/xml_mini/rexml.rb` — the
  default backend. `packages/activesupport/src/xml-mini/rexml-engine.test.ts`
  is still a PERMANENT-SKIP stub, and there is no
  `packages/activesupport/src/xml-mini/rexml.ts`.
- `xml_mini.rb:210` — `XmlMini.backend = "REXML"`, the module-bottom default
  assignment. `xml-mini.ts` deliberately ships NO default (`_backend` starts
  `undefined`, so `parse` raises until a caller sets a backend), with a comment
  at the declaration citing that line, because there is no REXML module to
  point it at.

`castBackendNameToModule` already resolves a name by importing
`./xml-mini/<name.toLowerCase()>.js`, so a `rexml.ts` exporting `parse` is all
the registry needs; `setBackend("REXML")` then works unchanged.

Also still unported in the same file: the `PARSING` typecast table
(`xml_mini.rb:66-96`) — the four `_parse*` helpers it dispatches to landed, but
the table itself (its `date`/`datetime`/`duration`/`yaml`/`decimal` procs) did
not — and `attr_accessor :depth` / `self.depth = 100` (`xml_mini.rb:97`). Those
are separate work; file them separately if this story does not absorb them.

## Acceptance criteria

- `packages/activesupport/src/xml-mini/rexml.ts` ports `XmlMini_REXML` with the
  Rails bodies and names (`parse`, `merge_element!`, `merge_texts!`,
  `merge_multiple_element!`, `empty_content?`, …), no `node:*` imports.
- The module-bottom `XmlMini.backend = "REXML"` default lands in `xml-mini.ts`,
  replacing the "no default backend" comment.
- `xml-mini/rexml-engine.test.ts` is enrolled (its three skip stubs become real
  tests) with the Rails test names verbatim.
- `pnpm parity:api` delta non-negative.
