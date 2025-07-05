import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { SemverSchema, ComponentVersion, BreakingChange } from './versioning';

describe('Versioning Types', () => {
  describe('SemverSchema', () => {
    it('should validate correct semantic versions', () => {
      const validVersions = [
        '0.0.0',
        '1.0.0',
        '1.2.3',
        '10.20.30',
        '1.0.0-alpha',
        '1.0.0-alpha.1',
        '1.0.0-0.3.7',
        '1.0.0-x.7.z.92',
        '1.0.0+20130313144700',
        '1.0.0-beta+exp.sha.5114f85',
      ];

      validVersions.forEach((version) => {
        expect(() => SemverSchema.parse(version)).not.toThrow();
      });
    });

    it('should reject invalid semantic versions', () => {
      const invalidVersions = [
        '1',
        '1.2',
        '1.2.3.4',
        '01.1.1',
        '1.01.1',
        '1.1.01',
        'v1.2.3',
        '1.2.3-',
        '1.2.3+',
      ];

      invalidVersions.forEach((version) => {
        expect(() => SemverSchema.parse(version)).toThrow();
      });
    });
  });

  describe('ComponentVersion', () => {
    it('should have all required fields', () => {
      const componentVersion: ComponentVersion = {
        name: 'Button',
        version: '2.0.0',
        previousVersions: ['1.0.0', '1.1.0', '1.2.0'],
        releaseDate: '2024-01-01',
        breaking: [
          {
            version: '2.0.0',
            description: 'Changed onClick prop to onPress',
            migration: 'Rename all onClick props to onPress',
            affectedAPIs: ['onClick'],
          },
        ],
        dependencies: {
          '@willow-cli/types': '^1.0.0',
          'react': '^18.0.0',
        },
      };

      expect(componentVersion.name).toBe('Button');
      expect(componentVersion.breaking).toHaveLength(1);
      expect(componentVersion.breaking?.[0].affectedAPIs).toContain('onClick');
    });
  });
});