import { describe, it, expect, beforeEach } from 'vitest';
import { EmotionTransformer } from '../src/styles/emotion/emotion-transformer';
import { EmotionParser } from '../src/styles/emotion/emotion-parser';

describe('Emotion Transformer', () => {
  let transformer: EmotionTransformer;

  beforeEach(() => {
    transformer = new EmotionTransformer();
  });

  describe('Parser', () => {
    let parser: EmotionParser;

    beforeEach(() => {
      parser = new EmotionParser();
    });

    it('should parse basic Emotion styled component', () => {
      const code = `
        import styled from '@emotion/styled';
        
        const Button = styled.button\`
          background-color: #007bff;
          color: white;
          padding: 10px 20px;
          border-radius: 4px;
        \`;
      `;

      const result = parser.parseEmotionComponent(code);
      
      expect(result.components).toHaveLength(1);
      expect(result.components[0].element).toBe('button');
      expect(result.components[0].styles.static['background-color']).toBe('#007bff');
    });

    it('should detect JSX pragma', () => {
      const code = `
        /** @jsx jsx */
        import { jsx, css } from '@emotion/react';
        
        const styles = css\`
          color: red;
        \`;
      `;

      const result = parser.parseEmotionComponent(code);
      
      expect(result.hasJsxPragma).toBe(true);
      expect(result.hasCssImport).toBe(true);
      expect(result.cssBlocks).toHaveLength(1);
    });

    it('should parse css prop usage', () => {
      const code = `
        <div css={css\`
          display: flex;
          align-items: center;
        \`}>
          Content
        </div>
      `;

      const cssPropUsages = parser.parseJsxCssProp(code);
      
      expect(cssPropUsages).toHaveLength(1);
      expect(cssPropUsages[0].element).toBe('div');
      expect(cssPropUsages[0].type).toBe('template');
      expect(cssPropUsages[0].cssValue).toContain('display: flex');
    });

    it('should parse css object prop', () => {
      const code = `
        <div css={{
          display: 'flex',
          alignItems: 'center'
        }}>
          Content
        </div>
      `;

      const cssPropUsages = parser.parseJsxCssProp(code);
      
      expect(cssPropUsages).toHaveLength(1);
      expect(cssPropUsages[0].type).toBe('object');
    });

    it('should parse Global styles', () => {
      const code = `
        import { Global, css } from '@emotion/react';
        
        <Global styles={css\`
          body {
            margin: 0;
            font-family: Arial;
          }
        \`} />
      `;

      const globalStyles = parser.parseGlobalStyles(code);
      
      expect(globalStyles).toHaveLength(1);
      expect(globalStyles[0].type).toBe('template');
      expect(globalStyles[0].styles).toContain('margin: 0');
    });

    it('should parse keyframes', () => {
      const code = `
        import { keyframes } from '@emotion/react';
        
        const bounce = keyframes\`
          from {
            transform: translateY(0);
          }
          to {
            transform: translateY(-20px);
          }
        \`;
      `;

      const keyframesList = parser.parseKeyframes(code);
      
      expect(keyframesList).toHaveLength(1);
      expect(keyframesList[0].name).toBe('bounce');
      expect(keyframesList[0].keyframes).toContain('transform: translateY(0)');
    });
  });

  describe('Detection', () => {
    it('should detect Emotion code', () => {
      expect(transformer.canTransform('import styled from "@emotion/styled"')).toBe(true);
      expect(transformer.canTransform('import { css } from "@emotion/react"')).toBe(true);
      expect(transformer.canTransform('import { css } from "@emotion/core"')).toBe(true);
      expect(transformer.canTransform('/** @jsx jsx */')).toBe(true);
      expect(transformer.canTransform('<div css={styles}>')).toBe(true);
      expect(transformer.canTransform('css`color: red;`')).toBe(true);
      expect(transformer.canTransform('const styles = { color: "red" }')).toBe(false);
    });
  });

  describe('Transformation', () => {
    it('should transform to styled-components', async () => {
      transformer = new EmotionTransformer({
        targetFramework: 'styled-components',
      });

      const code = `
        import styled from '@emotion/styled';
        import { css, keyframes, Global } from '@emotion/react';
        
        const Button = styled.button\`
          color: red;
        \`;
      `;

      const result = await transformer.transform(code);

      expect(result.transformed).toContain('styled-components');
      expect(result.transformed).not.toContain('@emotion');
      expect(result.transformed).toContain('createGlobalStyle');
    });

    it('should transform to CSS modules', async () => {
      transformer = new EmotionTransformer({
        targetFramework: 'css-modules',
      });

      const code = `
        import styled from '@emotion/styled';
        
        const Button = styled.button\`
          background-color: #007bff;
          color: white;
          
          &:hover {
            background-color: #0056b3;
          }
        \`;
      `;

      const result = await transformer.transform(code, {
        fileName: 'Button.tsx',
      });

      expect(result.transformed).toContain('import styles from');
      expect(result.transformed).toContain('className={`${styles.');
      expect(result.additionalFiles).toBeDefined();
      expect(result.additionalFiles?.[0].path).toBe('Button.module.css');
    });

    it('should transform css prop to className', async () => {
      transformer = new EmotionTransformer({
        targetFramework: 'css-modules',
      });

      const code = `
        import { css } from '@emotion/react';
        
        const Component = () => (
          <div css={css\`
            display: flex;
            gap: 10px;
          \`}>
            Content
          </div>
        );
      `;

      const result = await transformer.transform(code, {
        fileName: 'Component.tsx',
      });

      expect(result.transformed).toContain('className={styles.');
      expect(result.transformed).not.toContain('css={');
    });

    it('should transform to Tailwind', async () => {
      transformer = new EmotionTransformer({
        targetFramework: 'tailwind',
      });

      const code = `
        import styled from '@emotion/styled';
        
        const Button = styled.button\`
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: #fff;
          padding: 16px;
          border-radius: 8px;
        \`;
      `;

      const result = await transformer.transform(code);

      expect(result.transformed).toContain('className={`flex justify-center items-center');
      expect(result.transformed).not.toContain('@emotion');
    });

    it('should transform to CSS-in-JS objects', async () => {
      transformer = new EmotionTransformer({
        targetFramework: 'css-in-js',
      });

      const code = `
        import styled from '@emotion/styled';
        
        const Button = styled.button\`
          background-color: #007bff;
          color: white;
          font-size: 16px;
        \`;
      `;

      const result = await transformer.transform(code);

      expect(result.transformed).toContain('const buttonStyles = {');
      expect(result.transformed).toContain('backgroundColor');
      expect(result.transformed).toContain('fontSize');
      expect(result.transformed).toContain('style={{...buttonStyles');
    });

    it('should handle JSX pragma removal', async () => {
      transformer = new EmotionTransformer({
        targetFramework: 'styled-components',
      });

      const code = `
        /** @jsx jsx */
        import { jsx, css } from '@emotion/react';
        import styled from '@emotion/styled';
        
        const Button = styled.button\`
          color: red;
        \`;
      `;

      const result = await transformer.transform(code);

      expect(result.transformed).not.toContain('/** @jsx jsx */');
      expect(result.transformed).toContain('styled-components');
    });

    it('should convert Global to createGlobalStyle', async () => {
      transformer = new EmotionTransformer({
        targetFramework: 'styled-components',
      });

      const code = `
        import { Global, css } from '@emotion/react';
        
        const App = () => (
          <>
            <Global styles={css\`
              body {
                margin: 0;
              }
            \`} />
            <div>Content</div>
          </>
        );
      `;

      const result = await transformer.transform(code);

      expect(result.transformed).toContain('createGlobalStyle');
      expect(result.transformed).toContain('GlobalStyles');
    });

    it('should preserve css prop when requested', async () => {
      transformer = new EmotionTransformer({
        targetFramework: 'styled-components',
        preserveCssProp: true,
      });

      const code = `
        import { css } from '@emotion/react';
        
        <div css={css\`color: red;\`}>Content</div>
      `;

      const result = await transformer.transform(code);

      expect(result.transformed).toContain('css={');
    });

    it('should extract global styles', async () => {
      transformer = new EmotionTransformer({
        extractGlobalStyles: true,
      });

      const code = `
        import { Global, css } from '@emotion/react';
        
        <Global styles={css\`
          body { margin: 0; }
          h1 { color: blue; }
        \`} />
      `;

      const result = await transformer.transform(code);

      expect(result.metadata?.globalStyles).toBeDefined();
      expect(result.metadata?.globalStyles.count).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle mixed imports', async () => {
      const code = `
        import styled from '@emotion/styled';
        import { css, keyframes } from '@emotion/react';
        import { ThemeProvider } from '@emotion/react';
        
        const animation = keyframes\`
          0% { opacity: 0; }
          100% { opacity: 1; }
        \`;
      `;

      const result = await transformer.transform(code);
      
      expect(result.metadata?.hasKeyframes).toBe(true);
      expect(result.metadata?.hasThemeProvider).toBe(true);
    });

    it('should handle css prop with objects', async () => {
      transformer = new EmotionTransformer({
        targetFramework: 'css-in-js',
      });

      const code = `
        <div css={{ display: 'flex', color: 'red' }}>
          Content
        </div>
      `;

      const result = await transformer.transform(code);
      
      expect(result.transformed).toContain('style={');
      expect(result.transformed).not.toContain('css={');
    });

    it('should optimize css objects when requested', async () => {
      transformer = new EmotionTransformer({
        optimizeCssObjects: true,
      });

      const code = `
        import { css } from '@emotion/react';
        
        const styles = css({ color: 'red' });
      `;

      const result = await transformer.transform(code);
      
      expect(result.framework).toBe('emotion');
    });

    it('should add JSX pragma when requested', async () => {
      transformer = new EmotionTransformer({
        convertToJsxPragma: true,
      });

      const code = `
        import { css } from '@emotion/react';
        
        const styles = css\`color: red;\`;
      `;

      const result = await transformer.transform(code);
      
      expect(result.transformed).toContain('/** @jsx jsx */');
    });
  });
});