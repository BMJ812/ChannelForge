# Source-Tree Inventory

- **Source commit:** `195a4d04aca082af04362152f56283c139e9eaad`
- **Tracked entries:** `1825`
- **Source:** `git ls-files`

## Top-Level Distribution

| Top-level path | Tracked entries |
| --- | ---: |
| `(root)` | 25 |
| `.claude` | 7 |
| `.github` | 14 |
| `.husky` | 2 |
| `design` | 4 |
| `docker` | 3 |
| `docs` | 185 |
| `docs-extras` | 1 |
| `LICENSES` | 1 |
| `macos` | 41 |
| `patches` | 3 |
| `release` | 4 |
| `scripts` | 17 |
| `server` | 952 |
| `shared` | 21 |
| `types` | 60 |
| `web` | 485 |

## Extension Distribution

| Extension | Tracked entries |
| --- | ---: |
| `.cjs` | 1 |
| `.css` | 3 |
| `.dockerfile` | 1 |
| `.dockerignore` | 1 |
| `.entitlements` | 1 |
| `.gitignore` | 3 |
| `.gitkeep` | 3 |
| `.html` | 4 |
| `.icns` | 1 |
| `.ico` | 1 |
| `.js` | 1 |
| `.json` | 99 |
| `.m3u8` | 1 |
| `.md` | 97 |
| `.mjs` | 9 |
| `.mkv` | 2 |
| `.mp4` | 2 |
| `.nfo` | 15 |
| `.nix` | 1 |
| `.nvmrc` | 1 |
| `.patch` | 2 |
| `.pbxproj` | 1 |
| `.plist` | 3 |
| `.png` | 113 |
| `.po` | 3 |
| `.prettierignore` | 1 |
| `.prettierrc` | 1 |
| `.sh` | 7 |
| `.sql` | 47 |
| `.svg` | 14 |
| `.swift` | 5 |
| `.ts` | 1066 |
| `.tsx` | 285 |
| `.txt` | 3 |
| `.webp` | 1 |
| `.xcuserstate` | 2 |
| `.xcworkspacedata` | 1 |
| `.yaml` | 5 |
| `.yml` | 12 |
| `[none]` | 6 |

## Workspace Distribution

| Workspace path | Package | Tracked entries under path |
| --- | --- | ---: |
| `.` | `tunarr` | 25 |
| `server` | `@tunarr/server` | 952 |
| `shared` | `@tunarr/shared` | 21 |
| `types` | `@tunarr/types` | 60 |
| `web` | `@tunarr/web` | 485 |

## Root Tracked Files

- `.dockerignore`
- `.gitignore`
- `.nvmrc`
- `.prettierignore`
- `.prettierrc`
- `.release-it.json`
- `CHANGELOG.md`
- `CLAUDE.md`
- `commitlint.config.ts`
- `CONTRIBUTING.md`
- `Dockerfile`
- `eslint.config.mjs`
- `knip.json`
- `LICENSE`
- `mkdocs.yml`
- `NOTICE.md`
- `package.json`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- `README.md`
- `release.config.mjs`
- `shell.nix`
- `tsconfig.json`
- `turbo.json`
- `vitest.config.ts`

## Counting Rules

- Counts include Git-tracked files only.
- Generated, ignored, untracked, and local environment files are excluded.
- Workspace counts include all tracked files under the workspace directory.
- Root count includes tracked files without a directory separator.
- File extension is derived from the final path suffix; extensionless files
  are grouped as `[none]`.

## Limits

This inventory does not infer runtime ownership from directory names and does
not classify generated source, dead code, public API surface, or write
authority. Those concerns are handled by later Milestone 01 inventories.
