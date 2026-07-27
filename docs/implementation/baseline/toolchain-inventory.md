# Toolchain Inventory

- **Source commit:** `195a4d04aca082af04362152f56283c139e9eaad`
- **Platform classification:** Windows development baseline

## Verified Tool Versions

| Tool | Version or value | Authority |
| --- | --- | --- |
| Node.js | `v22.20.0` | Runtime used for capture; root engines.node requires 22 |
| pnpm | `10.28.0` | Root packageManager requires pnpm@10.28.0 |
| Git | `git version 2.53.0.windows.2` | Capture command boundary |
| PowerShell | `5.1.26100.8894` | Local Windows orchestration shell |
| TypeScript | `5.9.3` | pnpm workspace catalog |
| Turbo | `^2.5.3` | Root development dependency |
| Vitest | `^4.1.5` | pnpm itest catalog |
| pnpm lockfile | `9.0` | pnpm-lock.yaml |
| Operating system | `Microsoft Windows 10.0.26200` | Local capture environment |
| Platform | `win32` | Node runtime |
| Architecture | `x64` | Node runtime |

## Configuration Authorities

| Concern | Authority |
| --- | --- |
| Workspace membership | `pnpm-workspace.yaml` |
| Dependency resolution | `pnpm-lock.yaml` and workspace catalogs |
| Root package manager | `package.json#packageManager` |
| Supported Node major | `package.json#engines.node` |
| Task orchestration | `turbo.json` |
| TypeScript package versions | `pnpm-workspace.yaml#catalog` |
| Vitest package versions | `pnpm-workspace.yaml#catalogs.vitest` |
| Patched dependencies | `package.json#pnpm.patchedDependencies` |
| Native build allowlist | `package.json#pnpm.onlyBuiltDependencies` |

## Platform Authority

- Windows is a supported development platform.
- Linux remains the authoritative production and container platform.
- This record does not convert Windows-specific test failures into accepted
  production behavior.
- Linux baseline execution is deferred to PR 01F.
