import { CommandDefinition } from '../../types';
import { mountCommand } from './storage/mount';
import { lsblkCommand, findmntCommand } from './storage/lsblk';
import { pacmanCommand, paruCommand } from './packages/pacman';
import { systemctlCommand, journalctlCommand } from './system/systemctl';
import { wineCommand, gamescopeCommand, mangohudCommand, protontricksCommand } from './gaming/wine';
import { chmodCommand, cpCommand } from './filesystem/chmod';

export const ALL_COMMANDS: CommandDefinition[] = [
  mountCommand,
  lsblkCommand,
  findmntCommand,
  pacmanCommand,
  paruCommand,
  systemctlCommand,
  journalctlCommand,
  wineCommand,
  gamescopeCommand,
  mangohudCommand,
  protontricksCommand,
  chmodCommand,
  cpCommand
];

export function findCommandById(id: string): CommandDefinition | undefined {
  return ALL_COMMANDS.find((cmd) => cmd.id === id || cmd.executable === id);
}

export function searchCommands(query: string): CommandDefinition[] {
  const q = query.toLowerCase().trim();
  if (!q) return ALL_COMMANDS;
  return ALL_COMMANDS.filter((cmd) => {
    return (
      cmd.name.toLowerCase().includes(q) ||
      cmd.executable.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q) ||
      cmd.description.toLowerCase().includes(q) ||
      cmd.whatItDoes.toLowerCase().includes(q)
    );
  });
}
