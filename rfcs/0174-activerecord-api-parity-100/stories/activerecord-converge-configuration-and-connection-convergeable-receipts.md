---
title: "activerecord: the CONVERGEABLE receipts in database-configurations.ts, connection-handling.ts, connection-adapters.ts"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: receipts
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

CLAUDE.md admits two receipt shapes, `PERMANENT` and `CONVERGEABLE <story-id>`. These receipts say
`CONVERGEABLE` and then carry prose instead of a story id, so nothing tracks them
(`name-stories-for-activerecord-malformed-deviation-receipts`, RFC 0127, counts 92 such sites repo-wide;
`convergeable-tag-story-id`, RFC 0120, makes the shape an error). This story is the convergence the
prose promises, for:

- `connection-adapters.ts:172` `@noRailsEquivalent` — CONVERGEABLE TableDefinition#default_primary_key (abstract/schema_definitions.rb:170) hoisted to a free function; the port splits that file.
- `connection-handling.ts:35` `@noRailsEquivalent` — CONVERGEABLE reads the connection Ruby threads as with_connection's block parameter (connection_handling.rb:309).
- `database-configurations.ts:35` `@noRailsEquivalent` — CONVERGEABLE reads the configurations slot ActiveRecord::Base.configurations names directly (core.rb:77).
- `database-configurations.ts:44` `@noRailsEquivalent` — CONVERGEABLE writes that same configurations slot (core.rb:71); Ruby assigns through the Base accessor.

Slots and hoisted helpers Rails reaches through `Base.configurations`, `with_connection`'s block parameter, and `TableDefinition#default_primary_key`.

## Acceptance criteria

- [ ] Each of the 4 declarations converges onto the Rails shape its receipt names (the helper folded back into the Rails method, the slot read through the Rails accessor, the method renamed to Rails' name), and the receipt is deleted with it.
- [ ] Where one site genuinely cannot converge in this story, it is filed as its own story in this RFC and its receipt re-tagged `CONVERGEABLE <that-story>` — never left as prose, never PERMANENT.
- [ ] `pnpm parity:api:extra:gate` stays rowless; `:calls` and `:calls:args` green.

## Verification

```bash
pnpm parity:api:extra:gate && pnpm parity:api:receipts:gate && pnpm parity:api:reasons && pnpm parity:api:calls:args
```
