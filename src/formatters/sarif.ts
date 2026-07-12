import type { Issue, ScanResult } from '../types/index.js';

const SARIF_SCHEMA = 'https://schemastore.azureedge.net/schemas/sarif/sarif-2.1.0.json';
const SARIF_VERSION = '2.1.0';
const TOOL_NAME = 'i18n-pilot';
const TOOL_VERSION = '0.0.1';
const TOOL_URL = 'https://github.com/yourusername/i18n-pilot';

export interface SarifResult {
  $schema: string;
  version: string;
  runs: SarifRun[];
}

interface SarifRun {
  tool: SarifTool;
  results: SarifResultItem[];
  invocations?: SarifInvocation[];
  columnKind?: 'utf16CodeUnits' | 'unicodeCodePoints';
  originalUriBaseIds?: { [key: string]: { uri: string } };
}

interface SarifTool {
  driver: SarifDriver;
}

interface SarifDriver {
  name: string;
  version?: string;
  informationUri?: string;
  rules: SarifRule[];
}

interface SarifRule {
  id: string;
  shortDescription: { text: string };
  helpUri?: string;
  defaultConfiguration: { level: SarifLevel };
}

interface SarifResultItem {
  ruleId: string;
  level: SarifLevel;
  message: { text: string };
  locations: SarifLocation[];
}

interface SarifLocation {
  physicalLocation: SarifPhysicalLocation;
}

interface SarifPhysicalLocation {
  artifactLocation: SarifArtifactLocation;
  region: SarifRegion;
}

interface SarifArtifactLocation {
  uri: string;
  urireference?: string;
}

interface SarifRegion {
  startLine: number;
  startColumn?: number;
  endLine?: number;
  endColumn?: number;
  snippet?: SarifArtifactContent;
}

interface SarifArtifactContent {
  text?: string;
}

interface SarifInvocation {
  executionSuccessful: boolean;
}

type SarifLevel = 'error' | 'warning' | 'note' | 'none';

export function formatSarif(result: ScanResult, options: { targetPath: string }): string {
  const sarif: SarifResult = {
    $schema: SARIF_SCHEMA,
    version: SARIF_VERSION,
    runs: [
      {
        tool: {
          driver: {
            name: TOOL_NAME,
            version: TOOL_VERSION,
            informationUri: TOOL_URL,
            rules: getSarifRules(result.issues),
          },
        },
        columnKind: 'utf16CodeUnits',
        originalUriBaseIds: {
          '%SRCROOT%': { uri: 'file:///' },
        },
        results: getSarifResults(result, options),
      },
    ],
  };

  return JSON.stringify(sarif, null, 2);
}

function getSarifRules(issues: Issue[]): SarifRule[] {
  const ruleMap = new Map<string, SarifRule>();

  for (const issue of issues) {
    if (!ruleMap.has(issue.rule)) {
      ruleMap.set(issue.rule, {
        id: issue.rule,
        shortDescription: { text: getRuleDescription(issue.rule) },
        defaultConfiguration: {
          level: getSarifLevel(issue.severity),
        },
      });
    }
  }

  return Array.from(ruleMap.values());
}

function getRuleDescription(rule: string): string {
  switch (rule) {
    case 'jsx-text':
      return 'Hardcoded Chinese text in JSX elements';
    case 'jsx-attributes':
      return 'Hardcoded Chinese text in JSX attributes';
    case 'string-literals':
      return 'Hardcoded Chinese text in string literals';
    case 'template-literals':
      return 'Hardcoded Chinese text in template literals';
    default:
      return 'Hardcoded Chinese text detected';
  }
}

function getSarifResults(result: ScanResult, options: { targetPath: string }): SarifResultItem[] {
  const sarifResults: SarifResultItem[] = [];

  for (const issue of result.issues) {
    sarifResults.push({
      ruleId: issue.rule,
      level: getSarifLevel(issue.severity),
      message: { text: issue.message },
      locations: [
        {
          physicalLocation: {
            artifactLocation: {
              uri: makeUri(issue.file, options.targetPath),
            },
            region: {
              startLine: issue.line,
              ...(issue.column !== undefined ? { startColumn: issue.column } : {}),
              ...(issue.snippet ? { snippet: { text: issue.snippet } } : {}),
            },
          },
        },
      ],
    });
  }

  return sarifResults;
}

function getSarifLevel(severity: string): SarifLevel {
  switch (severity) {
    case 'error':
      return 'error';
    case 'warning':
      return 'warning';
    case 'info':
      return 'note';
    default:
      return 'warning';
  }
}

function makeUri(filePath: string, targetPath: string): string {
  try {
    const relativePath = require('path').relative(targetPath, filePath);
    return relativePath.replace(/\\/g, '/');
  } catch {
    return filePath.replace(/\\/g, '/');
  }
}
