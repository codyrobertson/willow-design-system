import { cn } from '@/lib/utils';

describe('Utility Functions', () => {
  describe('cn (className utility)', () => {
    it('merges class names correctly', () => {
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
    });

    it('handles conditional classes', () => {
      expect(cn('px-2', false && 'py-1', 'text-sm')).toBe('px-2 text-sm');
    });

    it('removes duplicate classes', () => {
      expect(cn('px-2 px-2', 'py-1')).toBe('px-2 py-1');
    });

    it('handles empty inputs', () => {
      expect(cn()).toBe('');
      expect(cn('')).toBe('');
      expect(cn(null, undefined)).toBe('');
    });

    it('merges tailwind classes with precedence', () => {
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });
  });
});