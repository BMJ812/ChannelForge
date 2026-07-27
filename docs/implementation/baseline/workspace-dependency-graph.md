# Workspace Dependency Graph

- **Source commit:** `195a4d04aca082af04362152f56283c139e9eaad`
- **Edge type:** Direct manifest dependency only

## Graph

```mermaid
graph TD
  package_0["tunarr<br/>."]
  package_1["@tunarr/server<br/>server"]
  package_2["@tunarr/shared<br/>shared"]
  package_3["@tunarr/types<br/>types"]
  package_4["@tunarr/web<br/>web"]
  package_0 -. workspace .-> package_1
  package_0 -. workspace .-> package_2
  package_0 -. workspace .-> package_3
  package_0 -. workspace .-> package_4
  package_1 --> package_2
  package_1 --> package_3
  package_2 --> package_3
  package_4 --> package_2
  package_4 --> package_3
```

The dotted root edges represent workspace orchestration, not package imports.
Solid edges represent direct package-manifest dependencies.

## Direct Workspace Edges

| From | To | Declared by |
| --- | --- | --- |
| `@tunarr/server` | `@tunarr/shared` | `server/package.json` |
| `@tunarr/server` | `@tunarr/types` | `server/package.json` |
| `@tunarr/shared` | `@tunarr/types` | `shared/package.json` |
| `@tunarr/web` | `@tunarr/shared` | `web/package.json` |
| `@tunarr/web` | `@tunarr/types` | `web/package.json` |

## Adjacency Matrix

| Package | @tunarr/server | @tunarr/shared | @tunarr/types | @tunarr/web |
| --- | --- | --- | --- | --- |
| `@tunarr/server` | â€” | Yes | Yes | â€” |
| `@tunarr/shared` | â€” | â€” | Yes | â€” |
| `@tunarr/types` | â€” | â€” | â€” | â€” |
| `@tunarr/web` | â€” | Yes | Yes | â€” |

## Interpretation Boundary

This graph describes inherited package coupling only. It does not authorize
the final ChannelForge domain graph or module boundaries.
