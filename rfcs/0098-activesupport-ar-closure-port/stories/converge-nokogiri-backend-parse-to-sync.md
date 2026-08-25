---
title: "Load the Nokogiri parser at backend-selection time so every XmlMini backend parses synchronously"
status: done
updated: 2026-08-21
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6837
claim: "2026-08-21T19:50:35Z"
assignee: "converge-through-reflection-association-primary-key-body"
blocked-by: null
closed-reason: null
---

## Context

`Hash.from_xml` is synchronous as of PR #6827 (`conversions.rb:128-135`), but
only for the default REXML backend. `XMLConverter`'s constructor
(`packages/activesupport/src/core-ext/hash/conversions.ts`) now raises a
`RuntimeError` when `XmlMini.parse` hands back a Promise, which is what the
Nokogiri backends do: `xml-mini/nokogiri.ts:114` and `xml-mini/nokogirisax.ts`
reach the optional `@blazetrails/nokogiri` package through a per-parse dynamic
`import()`. So `Hash.fromXml` / `fromTrustedXml` cannot be used under a
Nokogiri backend at all, where Rails' `XmlMini_Nokogiri#parse`
(`activesupport/lib/active_support/xml_mini/nokogiri.rb:19-31`) returns the
Hash directly.

`XmlMiniBackend#parse` is typed `Hash | Promise<Hash>` to carry this residue.

## Converged shape

Ruby loads a backend's parser with `require` at backend-SELECTION time —
`XmlMini.backend=` does `require "active_support/xml_mini/#{name}"`
(`xml_mini.rb:105-109`) — and trails' `setBackend` / `withBackend` are already
async for exactly that reason. Move the `@blazetrails/nokogiri` load to that
seat (cached on the backend module), so every backend's `parse` is synchronous,
`XmlMiniBackend#parse` returns a plain Hash, and the `RuntimeError` guard plus
the `Promise` arm of the union both disappear.
