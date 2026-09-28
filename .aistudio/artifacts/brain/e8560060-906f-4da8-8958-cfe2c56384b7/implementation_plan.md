# Vanguard Gaming and System Console — Implementation Plan

A serious, extensible command intelligence and execution system engineered for CachyOS and Arch Linux, unifying structured command generation, machine-aware discovery, dual-pane filesystem management, Wine/Proton/Steam gaming runtime orchestration, and Universal Context Cards into a cyber-dark desktop cockpit.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> **Confirmed Architectural Choices**:
> - **Brand Identity**: Vanguard Gaming and System Console (CachyOS Command & Gaming Intelligence).
> - **Visual Aesthetic**: CachyOS Cyber-Dark cockpit with KDE Plasma cyan accents (`#00d4ff`), dark obsidian structural canvas (`#0b0f19`), and single-elevation high-density layouts adhering strictly to anti-slop rules (unboxed metadata, tabular numerals, zero pill-badge clutter).
> - **Execution Architecture**: Hybrid execution gateway featuring an authentic CachyOS hardware and package simulation engine (block devices, Btrfs subvolumes, Wine prefixes, Steam app IDs, kernel variants) paired with a live-connectable WebSocket/HTTP daemon interface for real Arch/CachyOS local host execution.

---

### 1. Overview & Core Concept

#### What It Does
Vanguard is an object-centric command intelligence platform and execution gateway for Linux. Rather than forcing users to memorize flags or read manual pages, Vanguard represents operating system resources—commands, filesystem paths, block devices, partitions, systemd services, Wine prefixes, Proton runtimes, and Windows `.exe` files—as first-class typed objects. 

Every object is surfaced through a **Universal Context Card** that answers:
* *What is this object and what does the machine know about it?*
* *What actions can be executed on it right now?*
* *What previously worked or failed on this machine?*
* *Which dynamic parameters require user configuration versus automatic detection?*

#### Target Audience & Persona
- **CachyOS & Arch Linux power users, gamers, and system administrators** managing complex storage (NVMe, Btrfs, mount points), package managers (`pacman`, `paru`), system services (`systemd`), and gaming compatibility layers (Wine-GE, Proton, DXVK, VKD3D, Gamescope, MangoHud, Protontricks).
- **Users moving between Windows and Linux** needing intuitive Windows executable handling (`.exe` data redirection, save directories in `~/Documents`, prefix isolation) without sacrificing CLI transparency.

#### Key Value
Eliminates syntax anxiety and destructive blunders by transforming CLI workflows into typed, validated, and machine-aware execution pipelines with dry-run previews, contextual failure memory, and dual-pane filesystem operations.

---

### 2. User Experience & Visual Design

#### Key User Flows

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. Unified Search / Intent Input (e.g., "/dev/nvme" or "run Cyberpunk.exe")│
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. Universal Context Card: Object Metadata, Relationships & Tool Options   │
│    (Inspect UUIDs, mount status, Wine prefixes, Proton GE runtimes)         │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. Progressive Command Builder: Fixed vs. Dynamic Parameter Resolution      │
│    (Auto-detects devices, validates paths, suggests safe prerequisite mkdir)│
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 4. Safety Layer & Dry-Run Preview (Privilege check, risk tier, impact view) │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 5. Execution Gateway & Contextual Memory (Exit codes, logs, failure recall) │
└─────────────────────────────────────────────────────────────────────────────┘
```

1. **Omni-Search & Context Awakening**: Typing `/` triggers instant path/device navigation (e.g., `/dev/`, `/mnt/`, `/home/user/.steam/`). Typing an intent (e.g., `"mount external nvme"`, `"optimize wine prefix"`, `"systemctl restart"`) queries the structured knowledge base and local machine inventory simultaneously.
2. **Dual-Filesystem Workspace (Panel A ↔ Panel B)**: Side-by-side filesystem panels (e.g., `/run/media/user/Games` and `/home/user/Documents/My Games`). Dragging items across panels or selecting items activates contextual batch actions (Copy with `rsync`, Create Symlink, Archive, Bind Mount) with automatic conflict analysis.
3. **Executable & Compatibility Intelligence**: Selecting any `.exe` or `.msi` exposes its Windows Compatibility Card: detected architecture (x86_64), available Wine/Proton runtimes, Proton-GE versions, existing prefixes, save redirection target in `~/Documents`, and previous success/failure history.
4. **Execution Gateway & Command Preview**: Every operation displays the exact bash command, effective user, privilege escalation (`pkexec`/`sudo`), modified paths, and risk assessment (Read-Only, Safe, Privileged, Destructive) before any command runs.

#### Visual Identity & Theme
- **Aesthetic Direction**: CachyOS Cyber-Dark cockpit—precision engineering with KDE Plasma accents. Utilitarian, dense, responsive, and anti-slop.
- **Palette**:
  - Dominant Canvas (60%): Deep obsidian slate (`#070a11` and `#0d1322`).
  - Structural Panels & Dividers (30%): Hairline-bordered slate cards (`#141d30`, border `rgba(255, 255, 255, 0.08)`).
  - High-Intent Accents (10%): Electric KDE Plasma Cyan (`#00d4ff`) for focus and active states; Neon Emerald (`#10b981`) for nominal/verified states; Amber (`#f59e0b`) for warnings; Crimson (`#ef4444`) for destructive/root operations.
- **Typography & Formatting**:
  - Display & Section Headers: Clean, geometric high-contrast sans (`Plus Jakarta Sans` / `Cabinet Grotesk`).
  - Code, Commands, Telemetry, and Identifiers: Monospace tabular numerals (`JetBrains Mono`, `tabular-nums`) with full shell escaping.
  - Zero-Pill Rule: Metadata items (UUIDs, sizes, timestamps, permissions) are rendered as crisp, unboxed text separated by subtle bullets (`·`) or slashes (`/`), never candy badges.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Modular JSON-First Command & Knowledge Schemas**
  - *Chosen Approach*: Commands and troubleshooting entries are organized in modular domain catalogs (`commands/storage/mount.json`, `commands/gaming/gamescope.json`, `commands/packages/paru.json`, `troubleshooting/mount_errors.json`).
  - *Why*: Allows adding any future tool or Arch/CachyOS utility without writing custom UI components. The UI dynamically builds form controls, validations, and previews from JSON definitions.
  - *Alternatives Considered*: Hardcoded React component forms for each command. Rejected because it violates extensibility and breaks the universal data model.

- **Decision 2: Dual Mode Execution Gateway (Hybrid Simulator + Host Daemon Bridge)**
  - *Chosen Approach*: The system includes a rich, authentic in-browser CachyOS virtual environment (complete with real block devices, mounts, Wine prefixes, Steam app structures, and pacman cache) and provides a switchable local WebSocket/REST bridge (`http://localhost:9090` or custom port) for users connecting Vanguard to their real host.
  - *Why*: Allows immediate standalone exploration with full fidelity in the browser while providing a genuine execution bridge for real Linux environments.
  - *Alternatives Considered*: Mock-only (useless on actual CachyOS machines) or daemon-only (fails to run in self-contained web previews).

- **Decision 3: Structured Contextual History vs Chronological Shell Logs**
  - *Chosen Approach*: Command executions are indexed by object identity (UUID, hash, path, executable name, Wine prefix, Proton version). 
  - *Why*: Answering *"Which Proton version and launch flags worked for this executable?"* requires object-indexed memory rather than linear bash history. Non-zero exit codes are classified by root cause (process failure vs. configuration mismatch vs. missing prerequisite).

---

### 4. Technical Architecture & Data Strategy

#### Architecture & Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           VANGUARD CONSOLE UI                               │
├──────────────────────────────────────┬──────────────────────────────────────┤
│ Top Bar: Brand, Mode Switch (Hybrid) │ Omni-Search Bar (/ Filesystem, Intent)│
├──────────────────────────────────────┼──────────────────────────────────────┤
│ Left Panel:                          │ Right Panel:                         │
│ - Navigation & System Telemetry      │ - Dual-Pane Filesystem Workspace     │
│ - Hardware & Kernel Snapshot (Btrfs, │ - Interactive Command Builder        │
│   GPU Vulkan, CachyOS Kernel)        │ - Universal Context Card Inspector   │
│ - Multi-Step Workflows               │ - Dry-Run & Execution Gateway        │
│ - Troubleshooting Database           │ - Contextual History & Failure Log   │
└──────────────────────────────────────┴──────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CORE INTELLIGENCE LAYER                               │
├───────────────────────────────────┬─────────────────────────────────────────┤
│ Schema Engine & JSON Store        │ Path & Object Model                     │
│ (Commands, Flags, Types, Rules)   │ (Stable Identifiers, Types, Permissions)│
├───────────────────────────────────┼─────────────────────────────────────────┤
│ Contextual Memory Engine          │ Safety & Privilege Classifier           │
│ (30-day retention, confidence)    │ (Read-Only, Safe, Elevated, Destructive)│
└───────────────────────────────────┴─────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                  HYBRID EXECUTION GATEWAY (BRIDGE)                          │
├───────────────────────────────────┬─────────────────────────────────────────┤
│ CachyOS Local Simulator           │ Live Daemon Client                      │
│ - Linux /dev, /sys, /mnt tree     │ - WebSocket / REST streaming            │
│ - Btrfs, Steam, Wine, Proton state│ - Real bash, pacman, systemctl gateway │
└───────────────────────────────────┴─────────────────────────────────────────┘
```

#### Core Data Entities

1. **`CommandDefinition`**: Executable, subcommands, positional args, flags, fixed vs. dynamic tokens, safety tier, privilege requirements (`none`, `sudo`, `wheel`), CachyOS notes, and diagnostic recovery links.
2. **`UniversalContextObject`**: Standardized resource record (ID, path, stable identity/UUID, type: `device | file | directory | win_exe | wine_pfx | proton_pfx | steam_game | service | package`, metadata, permissions, active relations, recent executions).
3. **`ExecutionContext`**: Target command, resolved arguments, working directory, environment variables (`WINEPREFIX`, `MANGOHUD`, `VKD3D_CONFIG`), dry-run diff, exit code, stdout/stderr, and outcome classification (`success`, `user_abort`, `dependency_missing`, `fatal_error`).
4. **`WorkflowDefinition`**: Multi-step sequential or conditional action (e.g., *Inspect Partition → Validate Btrfs → Create Mount Directory → Mount with noatime,compress=zstd → Verify findmnt*).

#### Initial Command & Knowledge Base Catalogs
- **Core Storage & FS**: `mount`, `umount`, `lsblk`, `findmnt`, `blkid`, `btrfs subvolume`, `chmod`, `chown`.
- **System & Packages**: `systemctl`, `journalctl`, `pacman`, `paru`, `uname -r` (CachyOS optimized kernels).
- **Gaming & Compatibility**: `wine`, `winetricks`, `protontricks`, `gamescope`, `mangohud`, `vulkaninfo`.
- **Troubleshooting Knowledge Base**: Disk mount failures (`wrong fs type`, busy device), Wine prefix corruption, Vulkan ICD driver mismatch, shader cache errors.
