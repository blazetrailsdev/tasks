---
title: "Port Nokogiri::VersionInfo#libxml2? and use it in Scrub.force_correct_attribute_escaping!"
status: draft
updated: 2026-10-28
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Loofah::HTML5::Scrub.force_correct_attribute_escaping!`
(`vendor/loofah/v2.24.0/lib/loofah/html5/scrub.rb:156-157`) guards on
`Nokogiri::VersionInfo.instance.libxml2?`. trails' nokogiri has no
`VersionInfo` (`packages/nokogiri/src/version/info.ts` exports only the
module functions `usesLibxml` / `libxml2Patches`), so
`packages/html-sanitizer/src/loofah/html5/scrub.ts` `forceCorrectAttributeEscapingBang`
calls `usesLibxml()` instead (trails#9420).

## Acceptance criteria

- Port `Nokogiri::VersionInfo` (`vendor/nokogiri/v1.18.3/lib/nokogiri/version/info.rb`)
  with `instance` and `libxml2?` (as `isLibxml2`).
- `forceCorrectAttributeEscapingBang` calls `VersionInfo.instance.isLibxml2()`, as Loofah does.
