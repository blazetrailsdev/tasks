---
title: "pnpm parity:test:stubs generates 200 files by default; --dry-run should be the default"
status: done
updated: 2026-08-10
rfc: "0092-parity-tools-consolidation"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6347
claim: "2026-08-10T19:18:57Z"
assignee: "ar-closure-rollup-in-parity-summaries"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:test:stubs` (`parity:test:stubs` →
`scripts/test-compare/generate-stubs.ts`) **writes files by default**, and its
`--dry-run` flag is the opt-in. Every other gate in the `parity:*` namespace is
read-only unless explicitly asked to write (`--write` on the ratchets,
`--reseed` on the baselines), and the sibling generator story
`api-build-stub-generation-phase` (RFC 0025) specifies its tool as
"opt-in, no build-everything default" for exactly this reason.

The writes are at `generate-stubs.ts:213-224`:

```ts
const dir = path.dirname(tsFullPath);
fs.mkdirSync(dir, { recursive: true });

if (fs.existsSync(tsFullPath)) {
  const stubPath = tsFullPath.replace(/\.test\.ts$/, ".stub.test.ts");
  fs.writeFileSync(stubPath, content);
} else {
  fs.writeFileSync(tsFullPath, content);
}
```

**Observed cost.** During PR #6263 the tool was run once as a verification step
— the name reads like a reporting gate, and the review brief lists it alongside
read-only gates — and it created **200 files across 164 directories**. A
routine `git add -A` then swept all of them into a commit that was pushed. It
was caught and reverted (`reset` + `git clean` + force-push), but nothing about
the tool's name, output, or exit code signals that a verification run just
generated 5,164 lines of new test files.

This compounds with the known `lint-staged` behavior: once generated files are
staged, the pre-commit hook formats them, so the commit looks legitimately
authored.

## Converged shape

Invert the default so the tool matches the rest of the namespace:

- `pnpm parity:test:stubs` reports what it _would_ generate (the current `--dry-run`
  output) and writes nothing.
- Writing moves behind an explicit flag (`--write`, matching the ratchets'
  spelling rather than adding a third convention).
- The summary line states the file count plainly on both paths, so a write run
  is legible in scrollback.

Check whether any CI job or script invokes `parity:test:stubs` expecting the write
behavior before flipping; `grep -rn "parity:test:stubs\|parity:test:stubs" .github/
scripts/ package.json`.

## Acceptance criteria

- [ ] `pnpm parity:test:stubs` with no flags creates no files and exits 0.
- [ ] Generation happens only under an explicit write flag.
- [ ] Any in-repo caller relying on the old default is updated in the same
      change.
- [ ] CLAUDE.md's "Before you open the PR" list, if it names the tool, reflects
      that it is read-only by default.
