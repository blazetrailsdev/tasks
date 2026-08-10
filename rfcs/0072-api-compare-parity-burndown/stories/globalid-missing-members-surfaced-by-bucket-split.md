---
title: "globalid-missing-members-surfaced-by-bucket-split"
status: done
updated: 2026-08-08
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages:
  - globalid
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6221
claim: "2026-08-08T03:27:57Z"
assignee: "globalid-missing-members-surfaced-by-bucket-split"
blocked-by: null
closed-reason: null
---

## Context

Mapping `globalid:global_id.rb` through `RUBY_FILE_TS_OVERRIDES` (PR for
`api-compare-orphan-reopened-file-buckets`) moved GlobalID's own surface out of
the `fixture_set.rb` bucket it was mis-attributed to and surfaced four genuinely
missing/diverged members — globalid went 63/63 to 76/80:

- `deconstruct_keys` — Rails delegates it to `@uri`
  (`vendor/globalid/lib/global_id/global_id.rb:46`); trails destructures the
  components into private fields in the constructor and exposes no such method.
- `as_json` (`global_id.rb:78-80`, `def as_json(*) = to_s`) — trails ports it as
  `toJSON()`, which is the JS serialization hook, not the Rails name.
- `default_locator` (`global_id.rb:34-36`, `Locator.default_locator = ...`) —
  absent. Note `global-id.ts` reaches Locator through a DYNAMIC import to break
  the `global-id ↔ signed-global-id ↔ locator` TDZ cycle, so a literal port would
  be async; that constraint is the interesting part of this story.
- `parse_encoded_gid` (`global_id.rb:38-40`, private) — trails inlines the
  base64 fallback in `parse`'s catch instead of extracting the Rails helper.

## Acceptance criteria

- All four are ported at the Rails names, in Rails' source order, or a specific
  TypeScript language shortcoming is documented at the call site.
- `pnpm parity:api --package globalid` reports 80/80.
- `toJSON` is kept only as the JS hook, delegating to the ported `asJson`.
