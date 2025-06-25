import {
  BaseTokenUsageTracker,
  TokenUsageTrackerRegistry,
  type TokenUsageTrackingContext,
  type TokenMatcher,
  type FrameworkTrackingRules,
} from '../src/styles/theme-tokens/token-usage-tracker';
import {
  DesignToken,
  TokenType,
  TokenCategory,
  TokenFormat,
  TokenSemanticContext,
  TokenMigrationContext,
  TokenReference,
  TokenArray,
  TokenCompositeValue,
} from '../src/types/theme-tokens.types';

describe('Token Usage Tracker', () => {
  const sampleTokens: DesignToken[] = [
    {
      name: 'colors.primary.500',
      value: '#007bff',
      type: TokenType.COLOR,
      category: TokenCategory.COLOR,
      description: 'Primary brand color',
    },
    {
      name: 'colors.secondary.500',
      value: '#6c757d',
      type: TokenType.COLOR,
      category: TokenCategory.COLOR,
      description: 'Secondary color',
    },
    {
      name: 'spacing.md',
      value: '16px',
      type: TokenType.DIMENSION,
      category: TokenCategory.SPACING,
      description: 'Medium spacing',
    },
    {
      name: 'spacing.lg',
      value: '24px',
      type: TokenType.DIMENSION,
      category: TokenCategory.SPACING,
      description: 'Large spacing',
    },
    {
      name: 'font.family.sans',
      value: {
        $array: ['Inter', 'system-ui', 'sans-serif'],
      } as TokenArray,
      type: TokenType.FONT_FAMILY,
      category: TokenCategory.TYPOGRAPHY,
    },
    {
      name: 'shadow.elevated',
      value: {
        x: '0px',
        y: '4px',
        blur: '8px',
        color: 'rgba(0, 0, 0, 0.1)',
      } as TokenCompositeValue,
      type: TokenType.SHADOW,
      category: TokenCategory.SHADOW,
    },
    {
      name: 'button.primary.background',
      value: { $ref: 'colors.primary.500' } as TokenReference,
      type: TokenType.REFERENCE,
      category: TokenCategory.CUSTOM,
    },
    {
      name: 'unused.token',
      value: '#unused',
      type: TokenType.COLOR,
      category: TokenCategory.COLOR,
      description: 'This token is never used',
    },
  ];

  const trackingContext: TokenUsageTrackingContext = {
    includePatterns: ['**/*.{ts,tsx,js,jsx,css,scss,vue}'],
    excludePatterns: ['**/node_modules/**'],
    maxDepth: 5,
    trackComments: false,
    trackStrings: true,
    includeDependencies: true,
  };

  const migrationContext: TokenMigrationContext = {
    sourceFramework: 'custom',
    targetFramework: 'tailwind',
    preserveSemantics: true,
    strictValidation: false,
  };

  describe('BaseTokenUsageTracker', () => {
    let tracker: BaseTokenUsageTracker;

    beforeEach(() => {
      tracker = new BaseTokenUsageTracker(trackingContext);
    });

    describe('trackFileUsage', () => {
      it('should track CSS variable usage in CSS files', async () => {
        const cssContent = `
          .button {
            background-color: var(--colors-primary-500);
            padding: var(--spacing-md);
            box-shadow: var(--shadow-elevated);
          }
          
          .card {
            margin: var(--spacing-lg);
          }
        `;

        const usages = await tracker.trackFileUsage(
          '/src/styles/components.css',
          cssContent,
          sampleTokens,
          trackingContext
        );

        expect(usages.length).toBeGreaterThan(0);

        const primaryColorUsage = usages.find(u => u.tokenName === 'colors.primary.500');
        expect(primaryColorUsage).toBeDefined();
        expect(primaryColorUsage!.count).toBe(1);
        expect(primaryColorUsage!.locations.length).toBe(1);
        expect(primaryColorUsage!.locations[0].filePath).toBe('/src/styles/components.css');

        const spacingMdUsage = usages.find(u => u.tokenName === 'spacing.md');
        expect(spacingMdUsage).toBeDefined();

        const spacingLgUsage = usages.find(u => u.tokenName === 'spacing.lg');
        expect(spacingLgUsage).toBeDefined();
      });

      it('should track SCSS variable usage in SCSS files', async () => {
        const scssContent = `
          .component {
            background: $colors-primary-500;
            margin: $spacing-md;
            
            &:hover {
              background: $colors-secondary-500;
            }
          }
        `;

        const usages = await tracker.trackFileUsage(
          '/src/styles/component.scss',
          scssContent,
          sampleTokens
        );

        expect(usages.length).toBeGreaterThan(0);

        const primaryUsage = usages.find(u => u.tokenName === 'colors.primary.500');
        expect(primaryUsage).toBeDefined();

        const secondaryUsage = usages.find(u => u.tokenName === 'colors.secondary.500');
        expect(secondaryUsage).toBeDefined();
      });

      it('should track theme object access in TypeScript files', async () => {
        const tsContent = `
          import { theme } from './theme';
          
          const buttonStyles = {
            backgroundColor: theme.colors.primary.500,
            padding: theme.spacing.md,
            fontFamily: theme.font.family.sans,
          };
          
          const cardStyles = css\`
            background: \${theme.colors.secondary.500};
            margin: \${theme.spacing.lg};
          \`;
        `;

        const usages = await tracker.trackFileUsage(
          '/src/components/Button.tsx',
          tsContent,
          sampleTokens
        );

        expect(usages.length).toBeGreaterThan(0);

        const primaryUsage = usages.find(u => u.tokenName === 'colors.primary.500');
        expect(primaryUsage).toBeDefined();

        const spacingUsage = usages.find(u => u.tokenName === 'spacing.md');
        expect(spacingUsage).toBeDefined();

        const fontUsage = usages.find(u => u.tokenName === 'font.family.sans');
        expect(fontUsage).toBeDefined();
      });

      it('should track string literal token usage when enabled', async () => {
        const jsContent = `
          const config = {
            primaryColor: 'colors.primary.500',
            spacing: 'spacing.md',
          };
          
          const getTokenValue = (tokenName) => {
            switch (tokenName) {
              case 'colors.secondary.500':
                return '#6c757d';
              default:
                return null;
            }
          };
        `;

        const contextWithStrings = { ...trackingContext, trackStrings: true };
        const usages = await tracker.trackFileUsage(
          '/src/utils/tokens.js',
          jsContent,
          sampleTokens,
          contextWithStrings
        );

        expect(usages.length).toBeGreaterThan(0);

        const primaryUsage = usages.find(u => u.tokenName === 'colors.primary.500');
        expect(primaryUsage).toBeDefined();

        const secondaryUsage = usages.find(u => u.tokenName === 'colors.secondary.500');
        expect(secondaryUsage).toBeDefined();
      });

      it('should track usage in Vue single file components', async () => {
        const vueContent = `
          <template>
            <div class="component" :style="componentStyles">
              <button :style="{ backgroundColor: $colors.primary.500 }">
                Click me
              </button>
            </div>
          </template>
          
          <script>
          export default {
            computed: {
              componentStyles() {
                return {
                  padding: this.$theme.spacing.md,
                  margin: this.$theme.spacing.lg,
                };
              }
            }
          }
          </script>
          
          <style scoped>
          .component {
            background: var(--colors-secondary-500);
            box-shadow: var(--shadow-elevated);
          }
          </style>
        `;

        const usages = await tracker.trackFileUsage(
          '/src/components/Component.vue',
          vueContent,
          sampleTokens
        );

        expect(usages.length).toBeGreaterThan(0);

        // Should find usages from template, script, and style sections
        const primaryUsage = usages.find(u => u.tokenName === 'colors.primary.500');
        expect(primaryUsage).toBeDefined();

        const secondaryUsage = usages.find(u => u.tokenName === 'colors.secondary.500');
        expect(secondaryUsage).toBeDefined();

        const spacingUsage = usages.find(u => u.tokenName === 'spacing.md');
        expect(spacingUsage).toBeDefined();
      });

      it('should handle multiple usages of the same token', async () => {
        const cssContent = `
          .button-primary {
            background: var(--colors-primary-500);
            border-color: var(--colors-primary-500);
          }
          
          .button-hover:hover {
            background: var(--colors-primary-500);
          }
        `;

        const usages = await tracker.trackFileUsage(
          '/src/styles/buttons.css',
          cssContent,
          sampleTokens
        );

        const primaryUsage = usages.find(u => u.tokenName === 'colors.primary.500');
        expect(primaryUsage).toBeDefined();
        expect(primaryUsage!.count).toBe(3); // Used 3 times
        expect(primaryUsage!.locations.length).toBe(3);
      });

      it('should ignore tokens not in the provided list', async () => {
        const cssContent = `
          .component {
            background: var(--unknown-token);
            color: var(--colors-primary-500);
            margin: var(--another-unknown);
          }
        `;

        const usages = await tracker.trackFileUsage(
          '/src/styles/test.css',
          cssContent,
          sampleTokens
        );

        // Should only find the token that exists in sampleTokens
        expect(usages.length).toBe(1);
        expect(usages[0].tokenName).toBe('colors.primary.500');
      });

      it('should track usage with correct line and column information', async () => {
        const cssContent = `/* Line 1 */
.button {
  background-color: var(--colors-primary-500);
  padding: var(--spacing-md);
}`;

        const usages = await tracker.trackFileUsage(
          '/src/test.css',
          cssContent,
          sampleTokens
        );

        const primaryUsage = usages.find(u => u.tokenName === 'colors.primary.500');
        expect(primaryUsage).toBeDefined();
        expect(primaryUsage!.locations[0].line).toBe(3); // Line 3
        expect(primaryUsage!.locations[0].column).toBeGreaterThan(0);

        const spacingUsage = usages.find(u => u.tokenName === 'spacing.md');
        expect(spacingUsage).toBeDefined();
        expect(spacingUsage!.locations[0].line).toBe(4); // Line 4
      });
    });

    describe('scanForTokenUsage', () => {
      it('should scan multiple files and aggregate usage', async () => {
        // Mock file system - in real implementation, this would read actual files
        const mockFiles = [
          '/src/components/Button.tsx',
          '/src/styles/components.css',
          '/src/pages/Home.vue',
        ];

        // Since we can't actually read files in this test environment,
        // we'll test the structure and behavior
        const report = await tracker.scanForTokenUsage(mockFiles, sampleTokens, trackingContext);

        expect(report).toBeDefined();
        expect(report.metadata).toBeDefined();
        expect(report.metadata.scannedFiles).toBe(mockFiles.length);
        expect(report.metadata.timestamp).toBeDefined();
        expect(report.metadata.context).toBeDefined();

        expect(report.tokenUsages).toBeDefined();
        expect(report.fileUsages).toBeDefined();
        expect(report.unusedTokens).toBeDefined();
        expect(report.usagePatterns).toBeDefined();
      });

      it('should identify unused tokens', async () => {
        const mockFiles = ['/src/test.css'];
        
        const report = await tracker.scanForTokenUsage(mockFiles, sampleTokens, trackingContext);

        // Since no actual files are read, all tokens should be unused
        expect(report.unusedTokens.length).toBe(sampleTokens.length);
        expect(report.unusedTokens.map(t => t.name)).toEqual(sampleTokens.map(t => t.name));
      });

      it('should include performance metrics', async () => {
        const mockFiles = ['/src/test.css'];
        
        const startTime = performance.now();
        const report = await tracker.scanForTokenUsage(mockFiles, sampleTokens, trackingContext);
        const endTime = performance.now();

        expect(report.metadata.scanDuration).toBeGreaterThan(0);
        expect(report.metadata.scanDuration).toBeLessThan(endTime - startTime + 100); // Allow some margin
      });

      it('should build dependency graph when enabled', async () => {
        const contextWithDeps = { ...trackingContext, includeDependencies: true };
        const mockFiles = ['/src/test.css'];
        
        const report = await tracker.scanForTokenUsage(mockFiles, sampleTokens, contextWithDeps);

        expect(report.dependencyGraph).toBeDefined();
        expect(report.dependencyGraph!.nodes).toBeDefined();
        expect(report.dependencyGraph!.edges).toBeDefined();
        expect(report.dependencyGraph!.clusters).toBeDefined();
      });

      it('should handle file processing errors gracefully', async () => {
        const mockFiles = ['/nonexistent/file.css', '/another/invalid/path.tsx'];
        
        // Should not throw error, just log warnings and continue
        const report = await tracker.scanForTokenUsage(mockFiles, sampleTokens, trackingContext);

        expect(report).toBeDefined();
        expect(report.metadata.scannedFiles).toBe(mockFiles.length);
      });
    });

    describe('generateUsageAnalytics', () => {
      it('should generate comprehensive analytics from usage report', async () => {
        const mockReport = {
          metadata: {
            scannedFiles: 5,
            scannedLines: 1000,
            scanDuration: 150,
            timestamp: new Date().toISOString(),
            context: trackingContext,
          },
          tokenUsages: new Map([
            ['colors.primary.500', {
              tokenName: 'colors.primary.500',
              locations: [
                { filePath: '/src/button.css', line: 1, column: 1, context: 'usage', rawValue: 'var(--colors-primary-500)' },
                { filePath: '/src/card.css', line: 5, column: 10, context: 'usage', rawValue: 'var(--colors-primary-500)' },
              ],
              count: 2,
              lastUsed: new Date().toISOString(),
              context: {},
            }],
            ['spacing.md', {
              tokenName: 'spacing.md',
              locations: [
                { filePath: '/src/layout.css', line: 3, column: 5, context: 'usage', rawValue: 'var(--spacing-md)' },
              ],
              count: 1,
              lastUsed: new Date().toISOString(),
              context: {},
            }],
          ]),
          fileUsages: new Map([
            ['/src/button.css', {
              filePath: '/src/button.css',
              tokenCount: 2,
              uniqueTokens: ['colors.primary.500'],
              usagesByCategory: new Map([[TokenCategory.COLOR, 1]]),
              lastModified: new Date().toISOString(),
              fileSize: 500,
              language: 'css',
            }],
            ['/src/layout.css', {
              filePath: '/src/layout.css',
              tokenCount: 1,
              uniqueTokens: ['spacing.md'],
              usagesByCategory: new Map([[TokenCategory.SPACING, 1]]),
              lastModified: new Date().toISOString(),
              fileSize: 300,
              language: 'css',
            }],
          ]),
          unusedTokens: [sampleTokens[7]], // unused.token
          usagePatterns: [],
        };

        const analytics = await tracker.generateUsageAnalytics(mockReport);

        expect(analytics).toBeDefined();
        expect(analytics.totalTokens).toBe(3); // 2 used + 1 unused
        expect(analytics.usedTokens).toBe(2);
        expect(analytics.unusedTokens).toBe(1);

        expect(analytics.usageByCategory).toBeDefined();
        expect(analytics.usageByFileType).toBeDefined();
        expect(analytics.mostUsedTokens).toBeDefined();
        expect(analytics.leastUsedTokens).toBeDefined();
        expect(analytics.hotSpots).toBeDefined();
        expect(analytics.coverage).toBeDefined();

        expect(analytics.coverage.tokenCoverage).toBeCloseTo(66.67, 1); // 2/3 tokens used
        expect(analytics.coverage.fileCoverage).toBe(100); // All scanned files have tokens

        expect(analytics.mostUsedTokens[0].token).toBe('colors.primary.500');
        expect(analytics.mostUsedTokens[0].count).toBe(2);

        expect(analytics.hotSpots[0].file).toBe('/src/button.css');
        expect(analytics.hotSpots[0].tokenCount).toBe(2);
      });

      it('should handle empty usage reports', async () => {
        const emptyReport = {
          metadata: {
            scannedFiles: 0,
            scannedLines: 0,
            scanDuration: 0,
            timestamp: new Date().toISOString(),
            context: trackingContext,
          },
          tokenUsages: new Map(),
          fileUsages: new Map(),
          unusedTokens: sampleTokens,
          usagePatterns: [],
        };

        const analytics = await tracker.generateUsageAnalytics(emptyReport);

        expect(analytics.totalTokens).toBe(sampleTokens.length);
        expect(analytics.usedTokens).toBe(0);
        expect(analytics.unusedTokens).toBe(sampleTokens.length);
        expect(analytics.coverage.tokenCoverage).toBe(0);
        expect(analytics.coverage.fileCoverage).toBe(0);
      });
    });

    describe('generateRefactoringSuggestions', () => {
      it('should suggest removing unused tokens', async () => {
        const mockReport = {
          metadata: {
            scannedFiles: 3,
            scannedLines: 500,
            scanDuration: 100,
            timestamp: new Date().toISOString(),
            context: trackingContext,
          },
          tokenUsages: new Map([
            ['colors.primary.500', {
              tokenName: 'colors.primary.500',
              locations: [],
              count: 5,
              lastUsed: new Date().toISOString(),
              context: {},
            }],
          ]),
          fileUsages: new Map(),
          unusedTokens: [sampleTokens[7]], // unused.token
          usagePatterns: [],
        };

        const suggestions = await tracker.generateRefactoringSuggestions(mockReport);

        expect(suggestions.length).toBeGreaterThan(0);

        const removeUnusedSuggestion = suggestions.find(s => s.type === 'remove');
        expect(removeUnusedSuggestion).toBeDefined();
        expect(removeUnusedSuggestion!.title).toContain('unused');
        expect(removeUnusedSuggestion!.affectedTokens).toContain('unused.token');
        expect(removeUnusedSuggestion!.automatable).toBe(true);
        expect(removeUnusedSuggestion!.impact).toBe('low');
        expect(removeUnusedSuggestion!.effort).toBe('low');
      });

      it('should suggest consolidating similar tokens', async () => {
        const mockReport = {
          metadata: {
            scannedFiles: 3,
            scannedLines: 500,
            scanDuration: 100,
            timestamp: new Date().toISOString(),
            context: trackingContext,
          },
          tokenUsages: new Map([
            ['colors.primary.500', {
              tokenName: 'colors.primary.500',
              locations: [
                { filePath: '/src/button.css', line: 1, column: 1, context: 'usage', rawValue: 'var(--colors-primary-500)' },
                { filePath: '/src/card.css', line: 1, column: 1, context: 'usage', rawValue: 'var(--colors-primary-500)' },
              ],
              count: 2,
              lastUsed: new Date().toISOString(),
              context: {},
            }],
            ['colors.secondary.500', {
              tokenName: 'colors.secondary.500',
              locations: [
                { filePath: '/src/button.css', line: 5, column: 1, context: 'usage', rawValue: 'var(--colors-secondary-500)' },
                { filePath: '/src/card.css', line: 5, column: 1, context: 'usage', rawValue: 'var(--colors-secondary-500)' },
              ],
              count: 2,
              lastUsed: new Date().toISOString(),
              context: {},
            }],
          ]),
          fileUsages: new Map(),
          unusedTokens: [],
          usagePatterns: [],
        };

        const suggestions = await tracker.generateRefactoringSuggestions(mockReport);

        const consolidationSuggestion = suggestions.find(s => s.type === 'consolidate');
        expect(consolidationSuggestion).toBeDefined();
        expect(consolidationSuggestion!.affectedTokens.length).toBeGreaterThan(1);
        expect(consolidationSuggestion!.impact).toBe('medium');
        expect(consolidationSuggestion!.automatable).toBe(false);
      });

      it('should generate framework migration suggestions', async () => {
        const mockReport = {
          metadata: {
            scannedFiles: 3,
            scannedLines: 500,
            scanDuration: 100,
            timestamp: new Date().toISOString(),
            context: trackingContext,
          },
          tokenUsages: new Map([
            ['colors.primary.500', {
              tokenName: 'colors.primary.500',
              locations: [],
              count: 3,
              lastUsed: new Date().toISOString(),
              context: {},
            }],
          ]),
          fileUsages: new Map(),
          unusedTokens: [],
          usagePatterns: [],
        };

        const suggestions = await tracker.generateRefactoringSuggestions(mockReport, migrationContext);

        const migrationSuggestion = suggestions.find(s => s.type === 'migrate');
        expect(migrationSuggestion).toBeDefined();
        expect(migrationSuggestion!.title).toContain('Tailwind');
        expect(migrationSuggestion!.impact).toBe('high');
        expect(migrationSuggestion!.effort).toBe('high');
        expect(migrationSuggestion!.automatable).toBe(true);
      });

      it('should sort suggestions by priority', async () => {
        const mockReport = {
          metadata: {
            scannedFiles: 3,
            scannedLines: 500,
            scanDuration: 100,
            timestamp: new Date().toISOString(),
            context: trackingContext,
          },
          tokenUsages: new Map(),
          fileUsages: new Map(),
          unusedTokens: [sampleTokens[7]],
          usagePatterns: [{
            pattern: 'direct-value-usage',
            description: 'Direct values found',
            examples: ['#ff0000', '16px'],
            frequency: 5,
            confidence: 0.8,
            category: 'warning' as const,
          }],
        };

        const suggestions = await tracker.generateRefactoringSuggestions(mockReport);

        expect(suggestions.length).toBeGreaterThan(0);
        
        // Suggestions should be sorted by priority (confidence * impact weight)
        for (let i = 1; i < suggestions.length; i++) {
          const prev = suggestions[i - 1];
          const curr = suggestions[i];
          const prevPriority = prev.confidence * this.getImpactWeight(prev.impact);
          const currPriority = curr.confidence * this.getImpactWeight(curr.impact);
          expect(prevPriority).toBeGreaterThanOrEqual(currPriority);
        }
      });

      // Helper method for test
      getImpactWeight(impact: string): number {
        switch (impact) {
          case 'high': return 3;
          case 'medium': return 2;
          case 'low': return 1;
          default: return 1;
        }
      }
    });

    describe('Custom Matchers', () => {
      it('should apply custom token matchers', async () => {
        const customMatcher: TokenMatcher = {
          name: 'data-attribute-matcher',
          pattern: /data-token="([^"]+)"/g,
          fileTypes: ['typescript', 'javascript'],
          priority: 1,
        };

        const customContext = {
          ...trackingContext,
          customMatchers: [customMatcher],
        };

        const tracker = new BaseTokenUsageTracker(customContext);

        const jsContent = `
          const element = document.createElement('div');
          element.setAttribute('data-token', 'colors.primary.500');
          
          const anotherElement = <div data-token="spacing.md">Content</div>;
        `;

        const usages = await tracker.trackFileUsage(
          '/src/utils/dom.ts',
          jsContent,
          sampleTokens,
          customContext
        );

        expect(usages.length).toBeGreaterThan(0);

        const primaryUsage = usages.find(u => u.tokenName === 'colors.primary.500');
        expect(primaryUsage).toBeDefined();

        const spacingUsage = usages.find(u => u.tokenName === 'spacing.md');
        expect(spacingUsage).toBeDefined();
      });

      it('should apply function-based custom matchers', async () => {
        const functionMatcher: TokenMatcher = {
          name: 'comment-based-matcher',
          pattern: (content: string) => {
            const matches: any[] = [];
            const commentRegex = /\/\* token: ([^*]+) \*\//g;
            let match;
            while ((match = commentRegex.exec(content)) !== null) {
              matches.push({
                tokenName: match[1],
                start: match.index,
                end: match.index + match[0].length,
                context: match[0],
                confidence: 0.9,
              });
            }
            return matches;
          },
          fileTypes: ['css', 'typescript'],
          priority: 2,
        };

        const customContext = {
          ...trackingContext,
          customMatchers: [functionMatcher],
        };

        const tracker = new BaseTokenUsageTracker(customContext);

        const cssContent = `
          /* token: colors.primary.500 */
          .button {
            background: #007bff;
          }
          
          /* token: spacing.md */
          .card {
            padding: 16px;
          }
        `;

        const usages = await tracker.trackFileUsage(
          '/src/styles/annotated.css',
          cssContent,
          sampleTokens,
          customContext
        );

        expect(usages.length).toBe(2);

        const primaryUsage = usages.find(u => u.tokenName === 'colors.primary.500');
        expect(primaryUsage).toBeDefined();

        const spacingUsage = usages.find(u => u.tokenName === 'spacing.md');
        expect(spacingUsage).toBeDefined();
      });
    });

    describe('Usage Pattern Detection', () => {
      it('should detect direct value usage patterns', async () => {
        const mockUsages = new Map([
          ['colors.primary.500', {
            tokenName: 'colors.primary.500',
            locations: [
              { filePath: '/src/test.css', line: 1, column: 1, context: 'usage', rawValue: '#007bff' },
              { filePath: '/src/test.css', line: 2, column: 1, context: 'usage', rawValue: '16px' },
            ],
            count: 2,
            lastUsed: new Date().toISOString(),
            context: {},
          }],
        ]);

        const mockFileUsages = new Map();

        // Access private method for testing (in real implementation, this would be tested through public methods)
        const patterns = (tracker as any).detectUsagePatterns(mockUsages, mockFileUsages);

        const directValuePattern = patterns.find((p: any) => p.pattern === 'direct-value-usage');
        expect(directValuePattern).toBeDefined();
        expect(directValuePattern.category).toBe('warning');
        expect(directValuePattern.examples.length).toBeGreaterThan(0);
      });

      it('should detect naming inconsistency patterns', async () => {
        const mockUsages = new Map([
          ['colors.primary-500', { tokenName: 'colors.primary-500', locations: [], count: 1, lastUsed: '', context: {} }],
          ['colors.secondary_500', { tokenName: 'colors.secondary_500', locations: [], count: 1, lastUsed: '', context: {} }],
          ['colors.tertiaryColor', { tokenName: 'colors.tertiaryColor', locations: [], count: 1, lastUsed: '', context: {} }],
        ]);

        const patterns = (tracker as any).detectUsagePatterns(mockUsages, new Map());

        const namingPattern = patterns.find((p: any) => p.pattern === 'naming-inconsistency');
        expect(namingPattern).toBeDefined();
        expect(namingPattern.category).toBe('warning');
        expect(namingPattern.description).toContain('Inconsistent');
      });

      it('should detect token over-usage patterns', async () => {
        const mockUsages = new Map([
          ['overused.token', { tokenName: 'overused.token', locations: [], count: 100, lastUsed: '', context: {} }],
          ['normal.token', { tokenName: 'normal.token', locations: [], count: 5, lastUsed: '', context: {} }],
          ['another.token', { tokenName: 'another.token', locations: [], count: 3, lastUsed: '', context: {} }],
        ]);

        const patterns = (tracker as any).detectUsagePatterns(mockUsages, new Map());

        const overUsagePattern = patterns.find((p: any) => p.pattern === 'token-over-usage');
        expect(overUsagePattern).toBeDefined();
        expect(overUsagePattern.category).toBe('warning');
        expect(overUsagePattern.examples[0]).toContain('overused.token');
      });
    });

    describe('Dependency Graph Building', () => {
      it('should build dependency graph with nodes and edges', async () => {
        const mockUsages = new Map([
          ['colors.primary.500', {
            tokenName: 'colors.primary.500',
            locations: [
              { filePath: '/src/button.css', line: 1, column: 1, context: 'usage', rawValue: 'var(--colors-primary-500)' },
              { filePath: '/src/card.css', line: 1, column: 1, context: 'usage', rawValue: 'var(--colors-primary-500)' },
            ],
            count: 2,
            lastUsed: new Date().toISOString(),
            context: {},
          }],
          ['spacing.md', {
            tokenName: 'spacing.md',
            locations: [
              { filePath: '/src/button.css', line: 5, column: 1, context: 'usage', rawValue: 'var(--spacing-md)' },
            ],
            count: 1,
            lastUsed: new Date().toISOString(),
            context: {},
          }],
        ]);

        const graph = (tracker as any).buildDependencyGraph(sampleTokens, mockUsages);

        expect(graph).toBeDefined();
        expect(graph.nodes).toBeDefined();
        expect(graph.edges).toBeDefined();
        expect(graph.clusters).toBeDefined();

        expect(graph.nodes.length).toBe(sampleTokens.length);

        const primaryNode = graph.nodes.find((n: any) => n.tokenName === 'colors.primary.500');
        expect(primaryNode).toBeDefined();
        expect(primaryNode.usageCount).toBe(2);
        expect(primaryNode.files).toEqual(['/src/button.css', '/src/card.css']);

        // Should create edge between co-used tokens
        const coUsageEdge = graph.edges.find((e: any) => 
          (e.source === 'colors.primary.500' && e.target === 'spacing.md') ||
          (e.source === 'spacing.md' && e.target === 'colors.primary.500')
        );
        expect(coUsageEdge).toBeDefined();

        // Should create clusters by category
        const colorCluster = graph.clusters.find((c: any) => c.category === TokenCategory.COLOR);
        expect(colorCluster).toBeDefined();
        expect(colorCluster.tokens.length).toBeGreaterThan(1);
      });

      it('should calculate cluster cohesion correctly', async () => {
        const mockEdges = [
          { source: 'token1', target: 'token2', relationship: 'similar', weight: 1 },
          { source: 'token2', target: 'token3', relationship: 'similar', weight: 1 },
        ];

        const tokenNames = ['token1', 'token2', 'token3'];
        const cohesion = (tracker as any).calculateClusterCohesion(tokenNames, mockEdges);

        // For 3 tokens, max possible edges = (3 * 2) / 2 = 3
        // We have 2 edges, so cohesion = 2/3 = 0.667
        expect(cohesion).toBeCloseTo(0.667, 3);
      });
    });

    describe('Error Handling and Edge Cases', () => {
      it('should handle empty file content', async () => {
        const usages = await tracker.trackFileUsage(
          '/src/empty.css',
          '',
          sampleTokens
        );

        expect(usages).toBeDefined();
        expect(usages.length).toBe(0);
      });

      it('should handle files with only comments', async () => {
        const cssContent = `
          /* This is a comment */
          /* Another comment with colors.primary.500 mentioned */
          // Single line comment
        `;

        const usages = await tracker.trackFileUsage(
          '/src/comments.css',
          cssContent,
          sampleTokens,
          { ...trackingContext, trackComments: false }
        );

        expect(usages.length).toBe(0);
      });

      it('should handle malformed token patterns gracefully', async () => {
        const invalidContent = `
          .broken {
            color: var(--invalid-syntax;
            background: var(incomplete
          }
        `;

        const usages = await tracker.trackFileUsage(
          '/src/broken.css',
          invalidContent,
          sampleTokens
        );

        // Should not throw error, might find some partial matches
        expect(usages).toBeDefined();
      });

      it('should handle large files efficiently', async () => {
        // Generate large content
        const largeContent = Array(1000)
          .fill(0)
          .map((_, i) => `.class-${i} { color: var(--colors-primary-500); }`)
          .join('\n');

        const startTime = performance.now();
        const usages = await tracker.trackFileUsage(
          '/src/large.css',
          largeContent,
          sampleTokens
        );
        const endTime = performance.now();

        expect(usages.length).toBe(1);
        expect(usages[0].count).toBe(1000);
        expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      });
    });
  });

  describe('TokenUsageTrackerRegistry', () => {
    let registry: TokenUsageTrackerRegistry;

    beforeEach(() => {
      registry = new TokenUsageTrackerRegistry();
    });

    it('should have default tracker registered', () => {
      const trackers = registry.getAvailableTrackers();
      expect(trackers).toContain('base');
    });

    it('should allow custom tracker registration', () => {
      const customTracker = new BaseTokenUsageTracker();
      registry.register('custom', customTracker);

      const retrieved = registry.getTracker('custom');
      expect(retrieved).toBe(customTracker);

      const trackers = registry.getAvailableTrackers();
      expect(trackers).toContain('custom');
    });

    it('should scan for token usage using registry', async () => {
      const mockFiles = ['/src/test.css'];
      
      const report = await registry.scanForTokenUsage(mockFiles, sampleTokens, trackingContext);

      expect(report).toBeDefined();
      expect(report.metadata.scannedFiles).toBe(mockFiles.length);
    });

    it('should generate usage analytics using registry', async () => {
      const mockReport = {
        metadata: {
          scannedFiles: 1,
          scannedLines: 10,
          scanDuration: 50,
          timestamp: new Date().toISOString(),
          context: trackingContext,
        },
        tokenUsages: new Map(),
        fileUsages: new Map(),
        unusedTokens: sampleTokens,
        usagePatterns: [],
      };

      const analytics = await registry.generateUsageAnalytics(mockReport);

      expect(analytics).toBeDefined();
      expect(analytics.totalTokens).toBe(sampleTokens.length);
    });

    it('should generate refactoring suggestions using registry', async () => {
      const mockReport = {
        metadata: {
          scannedFiles: 1,
          scannedLines: 10,
          scanDuration: 50,
          timestamp: new Date().toISOString(),
          context: trackingContext,
        },
        tokenUsages: new Map(),
        fileUsages: new Map(),
        unusedTokens: [sampleTokens[7]],
        usagePatterns: [],
      };

      const suggestions = await registry.generateRefactoringSuggestions(mockReport);

      expect(suggestions).toBeDefined();
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should throw error for unknown tracker', async () => {
      expect(() => {
        registry.getTracker('nonexistent');
      }).toThrow('No token usage tracker available');

      await expect(
        registry.scanForTokenUsage([], sampleTokens, trackingContext, 'nonexistent')
      ).rejects.toThrow('No token usage tracker available');
    });
  });

  describe('Integration Tests', () => {
    let tracker: BaseTokenUsageTracker;

    beforeEach(() => {
      tracker = new BaseTokenUsageTracker(trackingContext);
    });

    it('should provide end-to-end usage tracking workflow', async () => {
      const mockFiles = ['/src/app.css', '/src/components.tsx'];
      
      // Step 1: Scan for usage
      const report = await tracker.scanForTokenUsage(mockFiles, sampleTokens, trackingContext);
      
      // Step 2: Generate analytics
      const analytics = await tracker.generateUsageAnalytics(report);
      
      // Step 3: Generate refactoring suggestions
      const suggestions = await tracker.generateRefactoringSuggestions(report, migrationContext);

      // Verify the complete workflow
      expect(report).toBeDefined();
      expect(analytics).toBeDefined();
      expect(suggestions).toBeDefined();

      expect(analytics.totalTokens).toBe(report.tokenUsages.size + report.unusedTokens.length);
      expect(suggestions.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle mixed file types in single scan', async () => {
      const mixedFiles = [
        '/src/styles.css',
        '/src/component.tsx',
        '/src/page.vue',
        '/src/layout.scss',
      ];

      const report = await tracker.scanForTokenUsage(mixedFiles, sampleTokens, trackingContext);

      expect(report.metadata.scannedFiles).toBe(mixedFiles.length);
      expect(report.fileUsages.size).toBeLessThanOrEqual(mixedFiles.length);
    });

    it('should provide accurate usage statistics across different frameworks', async () => {
      const tailwindContext = { ...trackingContext, framework: 'tailwind' };
      const chakraContext = { ...trackingContext, framework: 'chakra' };

      const tailwindFiles = ['/src/tailwind.css'];
      const chakraFiles = ['/src/chakra.tsx'];

      const tailwindReport = await tracker.scanForTokenUsage(tailwindFiles, sampleTokens, tailwindContext);
      const chakraReport = await tracker.scanForTokenUsage(chakraFiles, sampleTokens, chakraContext);

      expect(tailwindReport.metadata.context.framework).toBe('tailwind');
      expect(chakraReport.metadata.context.framework).toBe('chakra');
    });
  });
});