/**
 * Vanguard Core - Knowledge Engine
 * Manages declarative machine-readable command knowledge, troubleshooting schemas, and workflow catalogs
 */

import { CommandDefinition, TroubleshootingEntry, WorkflowDefinition } from '../../types';
import { ALL_COMMANDS, findCommandById, searchCommands } from '../../data/commands';
import { TROUBLESHOOTING_DATABASE } from '../../data/troubleshooting';
import { WORKFLOWS_DATABASE } from '../../data/workflows';

export class KnowledgeEngine {
  public getAllCommands(): CommandDefinition[] {
    return ALL_COMMANDS;
  }

  public getCommand(id: string): CommandDefinition | undefined {
    return findCommandById(id);
  }

  public searchCommands(query: string): CommandDefinition[] {
    return searchCommands(query);
  }

  public getTroubleshootingEntries(): TroubleshootingEntry[] {
    return TROUBLESHOOTING_DATABASE;
  }

  public matchTroubleshooting(errorMessageOrOutput: string): TroubleshootingEntry | undefined {
    const text = errorMessageOrOutput.toLowerCase();
    return TROUBLESHOOTING_DATABASE.find((entry) => {
      const pattern = entry.errorPattern.toLowerCase();
      return text.includes(pattern) || pattern.split(' ').every((token) => text.includes(token));
    });
  }

  public getWorkflows(): WorkflowDefinition[] {
    return WORKFLOWS_DATABASE;
  }

  public getWorkflow(id: string): WorkflowDefinition | undefined {
    return WORKFLOWS_DATABASE.find((w: WorkflowDefinition) => w.id === id);
  }
}
