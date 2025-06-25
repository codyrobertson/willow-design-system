import { describe, it, expect, beforeEach } from 'vitest';
import { StyledComponentsTransformer } from '../src/styles/styled-components/styled-components-transformer';
import { StyledComponentsParser } from '../src/styles/styled-components/styled-components-parser';

describe('Styled Components Transformer', () => {
  let transformer: StyledComponentsTransformer;

  beforeEach(() => {
    transformer = new StyledComponentsTransformer();
  });

  describe('Parser', () => {
    let parser: StyledComponentsParser;

    beforeEach(() => {
      parser = new StyledComponentsParser();
    });

    it('should parse basic styled component', () => {
      const code = `
        const Button = styled.button\`
          background-color: #007bff;
          color: white;
          padding: 10px 20px;
          border-radius: 4px;
        \`;
      `;

      const result = parser.parseStyledComponent(code);
      
      expect(result.components).toHaveLength(1);
      expect(result.components[0].element).toBe('button');
      expect(result.components[0].styles.static['background-color']).toBe('#007bff');
      expect(result.components[0].styles.static['padding']).toBe('10px 20px');
    });

    it('should parse styled component with props', () => {
      const code = `
        const Button = styled.button\`
          background-color: \${props => props.primary ? '#007bff' : '#6c757d'};
          color: \${props => props.color || 'white'};
          font-size: \${({ size }) => size || '16px'};
        \`;
      `;

      const result = parser.parseStyledComponent(code);
      
      expect(result.components[0].hasProps).toBe(true);
      expect(result.propUsages).toContain('primary');
      expect(result.propUsages).toContain('color');
      expect(result.propUsages).toContain('size');
    });

    it('should parse styled component with theme', () => {
      const code = `
        const Button = styled.button\`
          background-color: \${props => props.theme.colors.primary};
          font-family: \${({ theme }) => theme.fonts.body};
          border-radius: \${props => props.theme.radii.medium};
        \`;
      `;

      const result = parser.parseStyledComponent(code);
      
      expect(result.components[0].hasTheme).toBe(true);
      expect(result.themeUsages).toContain('colors.primary');
      expect(result.themeUsages).toContain('fonts.body');
      expect(result.themeUsages).toContain('radii.medium');
    });

    it('should parse wrapped styled component', () => {
      const code = `
        const StyledLink = styled(Link)\`
          color: #007bff;
          text-decoration: none;
          &:hover {
            text-decoration: underline;
          }
        \`;
      `;

      const result = parser.parseStyledComponent(code);
      
      expect(result.components[0].isWrapped).toBe(true);
      expect(result.components[0].element).toBe('Link');
      expect(result.components[0].styles.pseudo[':hover']).toContain('text-decoration: underline');
    });

    it('should parse css helper', () => {
      const code = `
        const sharedStyles = css\`
          display: flex;
          align-items: center;
          gap: 10px;
        \`;
      `;

      const result = parser.parseStyledComponent(code);
      
      expect(result.cssBlocks).toHaveLength(1);
      expect(result.cssBlocks[0]).toContain('display: flex');
    });

    it('should parse keyframes', () => {
      const code = `
        const fadeIn = keyframes\`
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        \`;
      `;

      const keyframes = parser.parseKeyframes(code);
      
      expect(keyframes).toHaveLength(1);
      expect(keyframes[0].name).toBe('fadeIn');
      expect(keyframes[0].keyframes).toContain('opacity: 0');
    });

    it('should parse global styles', () => {
      const code = `
        const GlobalStyle = createGlobalStyle\`
          body {
            margin: 0;
            font-family: Arial, sans-serif;
          }
        \`;
      `;

      const globalStyles = parser.parseGlobalStyles(code);
      
      expect(globalStyles).toHaveLength(1);
      expect(globalStyles[0]).toContain('margin: 0');
    });
  });

  describe('Transformation', () => {
    it('should detect styled-components code', () => {
      expect(transformer.canTransform('styled.div`color: red;`')).toBe(true);
      expect(transformer.canTransform('styled(Component)`color: blue;`')).toBe(true);
      expect(transformer.canTransform('css`display: flex;`')).toBe(true);
      expect(transformer.canTransform('const styles = { color: "red" }')).toBe(false);
    });

    it('should transform to CSS modules', async () => {
      transformer = new StyledComponentsTransformer({
        targetFramework: 'css-modules',
      });
      
      const code = `
        import styled from 'styled-components';
        
        const Button = styled.button\`
          background-color: #007bff;
          color: white;
          padding: 10px 20px;
          border-radius: 4px;
          
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

    it('should transform to Tailwind', async () => {
      transformer = new StyledComponentsTransformer({
        targetFramework: 'tailwind',
      });

      const code = `
        import styled from 'styled-components';
        
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
      expect(result.transformed).toContain('bg-white');
      expect(result.transformed).toContain('p-4');
      expect(result.transformed).toContain('rounded-lg');
      expect(result.transformed).not.toContain('import styled');
    });

    it('should transform to Emotion', async () => {
      transformer = new StyledComponentsTransformer({
        targetFramework: 'emotion',
      });

      const code = `
        import styled, { css, keyframes } from 'styled-components';
        
        const Button = styled.button\`
          color: red;
        \`;
      `;

      const result = await transformer.transform(code);

      expect(result.transformed).toContain('@emotion/styled');
      expect(result.transformed).toContain('@emotion/react');
      expect(result.transformed).not.toContain('styled-components');
    });

    it('should transform to CSS-in-JS objects', async () => {
      transformer = new StyledComponentsTransformer({
        targetFramework: 'css-in-js',
      });

      const code = `
        import styled from 'styled-components';
        
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

    it('should handle dynamic styles with props', async () => {
      const code = `
        const Button = styled.button\`
          background-color: \${props => props.primary ? '#007bff' : '#6c757d'};
          font-size: \${({ large }) => large ? '20px' : '16px'};
        \`;
      `;

      const result = await transformer.transform(code);

      expect(result.metadata?.propUsages).toContain('primary');
      expect(result.metadata?.propUsages).toContain('large');
    });

    it('should extract theme usage', async () => {
      transformer = new StyledComponentsTransformer({
        extractTheme: true,
      });

      const code = `
        const theme = {
          colors: {
            primary: '#007bff',
            secondary: '#6c757d',
          },
          fonts: {
            body: 'Arial, sans-serif',
          },
        };
        
        const Button = styled.button\`
          background-color: \${props => props.theme.colors.primary};
          font-family: \${({ theme }) => theme.fonts.body};
        \`;
      `;

      const result = await transformer.transform(code);

      expect(result.metadata?.theme).toBeDefined();
      expect(result.metadata?.themeUsages).toContain('colors.primary');
      expect(result.metadata?.themeUsages).toContain('fonts.body');
    });

    it('should generate type definitions', async () => {
      transformer = new StyledComponentsTransformer({
        generateTypeDefinitions: true,
      });

      const code = `
        const Button = styled.button\`
          background-color: \${props => props.primary ? '#007bff' : '#6c757d'};
          font-size: \${({ size }) => size || '16px'};
          color: \${props => props.disabled ? '#ccc' : 'white'};
        \`;
      `;

      const result = await transformer.transform(code);

      expect(result.metadata?.typeDefinitions).toBeDefined();
      expect(result.metadata?.typeDefinitions).toContain('interface');
    });

    it('should handle media queries', () => {
      const code = `
        const Container = styled.div\`
          width: 100%;
          padding: 20px;
          
          @media (min-width: 768px) {
            padding: 40px;
            max-width: 1200px;
          }
          
          @media (max-width: 480px) {
            padding: 10px;
          }
        \`;
      `;

      const parser = new StyledComponentsParser();
      const result = parser.parseStyledComponent(code);

      expect(Object.keys(result.components[0].styles.media)).toHaveLength(2);
      expect(result.components[0].styles.media['(min-width: 768px)']).toContain('padding: 40px');
    });

    it('should handle nested selectors', () => {
      const code = `
        const Card = styled.div\`
          background: white;
          
          & > h2 {
            color: #333;
            margin-bottom: 10px;
          }
          
          & .content {
            padding: 20px;
          }
        \`;
      `;

      const parser = new StyledComponentsParser();
      const result = parser.parseStyledComponent(code);

      expect(result.components[0].styles.nested['> h2']).toContain('color: #333');
      expect(result.components[0].styles.nested['.content']).toContain('padding: 20px');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty styled components', async () => {
      const code = `
        const Empty = styled.div\`\`;
      `;

      const result = await transformer.transform(code);
      expect(result.transformed).toBeDefined();
      expect(result.warnings).toHaveLength(0);
    });

    it('should handle complex conditional styles', () => {
      const code = `
        const Complex = styled.div\`
          display: \${({ show }) => show ? 'block' : 'none'};
          \${props => props.active && css\`
            background: blue;
            color: white;
          \`}
        \`;
      `;

      const parser = new StyledComponentsParser();
      const result = parser.parseStyledComponent(code);

      expect(result.components[0].hasProps).toBe(true);
      expect(result.propUsages).toContain('show');
      expect(result.propUsages).toContain('active');
    });

    it('should preserve non-styled-components code', async () => {
      const code = `
        import React from 'react';
        
        const regularFunction = () => {
          console.log('not a styled component');
        };
        
        const Button = styled.button\`
          color: red;
        \`;
        
        export { regularFunction, Button };
      `;

      const result = await transformer.transform(code);
      
      expect(result.transformed).toContain('regularFunction');
      expect(result.transformed).toContain("console.log('not a styled component')");
    });
  });
});