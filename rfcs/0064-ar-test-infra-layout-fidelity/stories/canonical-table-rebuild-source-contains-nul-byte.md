---
title: "canonical-table-rebuild.ts holds a NUL byte, so grep silently skips it"
status: done
updated: 2026-07-31
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: 5688
claim: "2026-07-30T23:33:17Z"
assignee: "canonical-table-rebuild-source-contains-nul-byte"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/support/canonical-table-rebuild.ts` contains a raw
NUL byte around offset 11407. Every grep-based tool treats the file as binary
and skips it: plain `grep -rn "ensureCanonicalTables" packages/` returns
nothing, and `rg -n` prints only `binary file matches (found "\0" byte around
offset 11407)`. Only `rg -a` / `rg --text` shows the real hits.

The file genuinely exports `fkSafeDropPlan`, `bulkInboundFkHost`,
`rebuildCanonicalTables` and `ensureCanonicalTables` (`rg -a`: lines 106, 192,
270, 345). During PR #5657 this made it look like `ensureCanonicalTables` had
been deleted repo-wide — the very symbol the `no-internal-canonical-loaders`
rule bans. Any audit, ratchet, or agent that greps for a symbol will silently
get a wrong answer about this file. Tooling that reads via
`fs.readFile(..., "utf8")` (including #5657's new guard test) is unaffected,
which is why nothing failed.

Locate the byte with `rg -a -n --pcre2 '\x00' <file>`; it is most likely inside
a string literal for a test payload and should be written as a `\0` escape
rather than a raw byte.

## Acceptance criteria

- No raw NUL byte in the file; any intended NUL value is expressed as a string
  escape so the source stays plain text.
- `rg -n "ensureCanonicalTables" packages/activerecord/src/support/canonical-table-rebuild.ts`
  reports the real line instead of `binary file matches`.
- Behavior unchanged: `canonical-table-rebuild.test.ts` and
  `canonical-table-rebuild-bulk-inbound-fk.test.ts` still pass.
- Consider a cheap repo-wide check for raw control bytes in `.ts` sources so a
  second one cannot land unnoticed.
