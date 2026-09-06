---
title: "no-node-builtins declines the fs/path members whose Ruby seat reorders or drops an argument"
status: claimed
updated: 2026-09-05
rfc: "0135-platform-adapters-in-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: 38
pr: null
claim: "2026-09-05T23:56:30Z"
assignee: "io-external-encoding-is-hardcoded-utf8"
blocked-by: null
closed-reason: null
---

## Context

`eslint/no-node-builtins.mjs` (as of #7467) autofixes a Node-builtin import to
its Ruby seat on `File` / `Dir`, but only for members whose Ruby counterpart
takes the same arguments in the same order. The `members` tables today are:

- `fs`: `existsSync` → `File.isExist`, `statSync` → `File.stat`, `renameSync` →
  `File.rename`, `unlinkSync` → `File.delete`, `readdirSync` → `Dir.children`,
  `rmdirSync` → `Dir.delete`.
- `path`: `join`, `dirname`, `basename`, `extname`, `sep` → `File.SEPARATOR`.

Everything else is reported with the message and NO fix, because the seat's
argument list differs and a mechanical identifier swap would emit a call that
does not type-check. The ones a developer actually hits:

- `fs.readFileSync(name, "utf-8")` → `File.read(name)`
  (`packages/ruby-compat/src/file.ts:169`, Ruby `File.read`) — the encoding
  argument has no seat and must be DROPPED, not forwarded.
- `fs.writeFileSync(name, string)` → `File.write(name, string)`
  (`file.ts:195`) — compatible today, but only for the two-argument arm; the
  options arm is not.
- `fs.chmodSync(name, mode)` → `File.chmod(mode, ...files)` (`file.ts:233`) —
  Ruby takes the mode FIRST, so the fix must reorder.
- `path.resolve(dir, name)` → `File.expandPath(name, dir)` (`file.ts:360`,
  Ruby `File.expand_path`) — reversed argument order, same reason.
- `path.isAbsolute(name)` → `File.isAbsolutePath(name)` (`file.ts:370`).
- `fs.mkdirSync` → `FileUtils.mkdirP` (`packages/ruby-compat/src/file-utils.ts`).
- `fs.realpathSync` → `File.realpath` (`file.ts:284`).

## Acceptance criteria

- A member seat can carry an argument transform (drop / reorder / rename), not
  just a receiver-and-name pair, and the arms above are autofixable.
- `path.isAbsolute` and `fs.realpathSync` — pure renames — join the plain
  `members` table; no transform needed.
- A fixture test per new arm asserts the rewritten CALL, arguments included,
  and the existing seat proof is widened to cover it.
- A member with no seat still reports without a fix; the rule never emits an
  argument list it cannot justify from `file.ts` / `file-utils.ts`.
