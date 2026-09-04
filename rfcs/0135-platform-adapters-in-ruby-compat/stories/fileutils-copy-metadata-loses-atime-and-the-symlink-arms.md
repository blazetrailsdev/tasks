---
title: "FileUtils.copy_metadata loses st.atime and both symlink arms — FsStatResult has no atime and copyMetadata does not lstat"
status: done
updated: 2026-09-04
rfc: "0135-platform-adapters-in-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: 23
pr: 7476
claim: "2026-09-04T12:01:32Z"
assignee: "fileutils-rm-rf-is-spelled-rm-r-force-true"
blocked-by: null
closed-reason: null
---

## Context

`FileUtils.copyMetadata` (`packages/ruby-compat/src/file-utils.ts`, landed by
PR #7426) ports `Entry_#copy_metadata`
(`vendor/ruby/lib/fileutils.rb:2285-2312`) but reaches only its regular-file
arms, because the fs backend contract is missing two things. Both gaps are
cited in the helper's JSDoc today; this story closes them.

Ruby's body:

```ruby
def copy_metadata(path)
  st = lstat()
  if !st.symlink?
    File.utime st.atime, st.mtime, path
  end
  mode = st.mode
  begin
    if st.symlink?
      begin
        File.lchown st.uid, st.gid, path
      rescue NotImplementedError
      end
    else
      File.chown st.uid, st.gid, path
    end
  rescue Errno::EPERM, Errno::EACCES
    mode &= 01777          # clear setuid/setgid
  end
  if st.symlink?
    begin
      File.lchmod mode, path
    rescue NotImplementedError, Errno::EOPNOTSUPP
    end
  else
    File.chmod mode, path
  end
end
```

Two divergences in the port:

1. **No `st.atime`.** `FsStatResult` (`packages/ruby-compat/src/fs-adapter.ts`)
   carries `mtime` alone, so the port passes `mtime` for both arguments of
   `File.utime st.atime, st.mtime, path`. A `preserve`d copy therefore loses the
   source's access time.
2. **The symlink arms are unreachable.** `copyMetadata` stats rather than
   lstats, so `st.symlink?` is never true and the `File.lchown` / `File.lchmod`
   branches — including their `NotImplementedError` / `Errno::EOPNOTSUPP`
   rescues — have no port. `lstatSync` is now on the contract (added by #7426
   for `Entry_#directory?`) but optional, and `copyMetadata` does not use it.

This reaches real behaviour through `mv`'s cross-device fallback, which calls
`copy_entry(s, d, true)` (`fileutils.rb:1172`): a cross-device `mv` of a
symlink, or of any file whose atime matters, diverges from Rails.

## Converged shape

- Add `atime: Date` to `FsStatResult` and populate it in the Node registration
  (`fs-adapter.ts`'s `tryAutoRegisterNode`); `node:fs`'s `Stats` already carries
  it, so this is a type-and-wiring change, not new I/O.
- Have `copyMetadata` read through `lstatSync` where the backend has one, and
  port both symlink arms — `File.lchown` and `File.lchmod` — behind optional
  `lchownSync` / `lchmodSync` members on the contract, each with Ruby's rescue
  arm for the platforms that do not implement it.
- Pass `st.atime` and `st.mtime` separately to `utimesSync`.

## Acceptance criteria

- `FsStatResult.atime` exists and `copyMetadata` passes it as `File.utime`'s
  first argument.
- `copyMetadata` lstats, and both symlink arms are ported with their
  `NotImplementedError` / `Errno::EOPNOTSUPP` equivalents.
- The JSDoc gap notes on `copyMetadata` in `file-utils.ts` are deleted, not
  reworded — they exist only to mark this debt.
- A test covers a `preserve`d copy of a symlink and of a file with a distinct
  atime.
