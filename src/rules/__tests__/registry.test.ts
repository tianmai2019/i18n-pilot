import { describe, expect, it } from 'vitest';
import { RuleRegistry } from '../registry.js';
import type { Rule } from '../../types/index.js';

const mockRule: Rule = {
  name: 'mock-rule',
  description: 'Mock rule',
  check: async () => [],
};

describe('RuleRegistry', () => {
  it('returns registered rules in insertion order', () => {
    const registry = new RuleRegistry();
    registry.register(mockRule);

    expect(registry.getAll()).toEqual([mockRule]);
  });

  it('throws for duplicate rule names', () => {
    const registry = new RuleRegistry();
    registry.register(mockRule);

    expect(() => registry.register(mockRule)).toThrow('already registered');
  });

  it('resolves enabled rules with severity overrides', () => {
    const registry = new RuleRegistry();
    registry.register(mockRule);

    expect(registry.resolve({ 'mock-rule': 'error' })).toEqual([
      { rule: mockRule, severity: 'error' },
    ]);
  });

  it('skips disabled rules', () => {
    const registry = new RuleRegistry();
    registry.register(mockRule);

    expect(registry.resolve({ 'mock-rule': 'off' })).toEqual([]);
  });
});
