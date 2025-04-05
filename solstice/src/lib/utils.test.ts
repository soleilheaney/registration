import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('test1', 'test2')).toBe('test1 test2');
      expect(cn('test1', null, undefined, 'test2')).toBe('test1 test2');
      expect(cn('test1', false && 'test2', true && 'test3')).toBe('test1 test3');
    });
  });
});