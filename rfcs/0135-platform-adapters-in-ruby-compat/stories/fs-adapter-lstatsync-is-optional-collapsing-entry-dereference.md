---
title: "lstatSync is optional on the fs backend, collapsing Entry_#lstat's dereference? arms"
status: draft
updated: 2026-09-06
rfc: "0135-platform-adapters-in-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Entry_#lstat` (`vendor/ruby/lib/fileutils.rb:2192-2198`) selects on
`dereference?`:

```ruby
def lstat
  if dereference?
    @lstat ||= File.stat(path())
  else
    @lstat ||= File.lstat(path())
  end
end
```

`packages/ruby-compat/src/file-utils.ts`'s port (PR #7580, carried over from the
loose `entryLstat` it folded in) collapses the two arms whenever the backend has
no `lstatSync`:

```ts
if (this.isDereference || !fs.lstatSync) {
  return (this._lstat ??= fs.statSync(this.path));
}
```

`lstatSync` is optional on the `FsBackend` contract
(`packages/ruby-compat/src/fs-adapter.ts:59`), so a backend without one silently
dereferences every entry: `Entry_#symlink?` (`fileutils.rb:2128-2131`) answers
false for a symlink, `copy` takes the target's arm instead of
`File.symlink File.readlink(path)` (`:2253-2254`), and `remove_entry` descends
INTO a symlinked directory rather than unlinking it. That last one is data loss,
not a cosmetic divergence.

Sibling instance of the same optional-member shape:
`fs-adapter-readfile-is-optional-forcing-a-dead-guard`.

## Converged shape

Make `lstatSync` required on the backend contract, so `Entry_#lstat` is Ruby's
two-arm body with no third case. Every in-repo adapter already implements it;
the guard exists for a hypothetical backend, and the cost of that hypothetical
is a silent symlink-follow in `remove_entry`.

## Acceptance criteria

- `lstatSync` is non-optional in `fs-adapter.ts`, and `Entry_#lstat` is the
  `dereference?` two-arm body with no backend-capability branch.
- The JSDoc deviation note on `Entry_#lstat` is deleted, not reworded.
- A test asserts `remove_entry` unlinks a symlink to a directory rather than
  descending into it.
