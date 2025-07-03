/**
 * Template Usage Example
 * Demonstrates how to use the template library with various frameworks
 */

import {
  TemplateRegistry,
  TemplateProcessor,
  FileWriter,
  FileWriterConfig,
  ConflictResolution,
  TemplateEngine,
} from '../src';

async function demonstrateTemplateUsage() {
  // Initialize template registry and processor
  const registry = new TemplateRegistry();
  await registry.initialize();

  const processor = new TemplateProcessor();
  const fileWriter = new FileWriter();

  // Configure file writer
  const writerConfig: FileWriterConfig = {
    outputDir: './generated',
    conflictResolution: ConflictResolution.Overwrite,
    createDirectories: true,
    createBackups: true,
  };

  console.log('=== Template Library Usage Examples ===\n');

  // Example 1: Generate a React component
  console.log('1. Generating React Functional Component...');

  const reactComponentConfig = registry.createTemplateConfig(
    'react-functional-component',
    {
      componentName: 'UserProfile',
      props: [
        { name: 'user', type: 'User', optional: false },
        { name: 'onEdit', type: '() => void', optional: true },
      ],
      useState: true,
      useEffect: true,
      styling: 'tailwind',
      exportDefault: false,
    },
    'components/UserProfile.tsx'
  );

  const reactCode = await processor.process(reactComponentConfig);
  const reactResult = await fileWriter.writeFile(
    { code: reactCode, filePath: reactComponentConfig.outputPath },
    writerConfig
  );

  console.log('Generated:', reactResult.filePath);
  console.log('Action:', reactResult.action);

  // Example 2: Generate a React custom hook
  console.log('\n2. Generating React Custom Hook...');

  const hookConfig = registry.createTemplateConfig(
    'react-custom-hook',
    {
      hookName: 'useUserData',
      parameters: [
        { name: 'userId', type: 'string', optional: false },
        { name: 'options', type: 'FetchOptions', optional: true },
      ],
      returnType: '{ data: User | null; loading: boolean; error: Error | null }',
      dependencies: ['useState', 'useEffect', 'useCallback'],
      description: 'Hook for fetching and managing user data',
    },
    'hooks/useUserData.ts'
  );

  const hookCode = await processor.process(hookConfig);
  const hookResult = await fileWriter.writeFile(
    { code: hookCode, filePath: hookConfig.outputPath },
    writerConfig
  );

  console.log('Generated:', hookResult.filePath);

  // Example 3: Generate a Vue component
  console.log('\n3. Generating Vue Composition API Component...');

  const vueComponentConfig = registry.createTemplateConfig(
    'vue-composition-component',
    {
      componentName: 'TaskList',
      props: [
        { name: 'tasks', type: 'Task[]', optional: false },
        { name: 'readonly', type: 'boolean', optional: true },
      ],
      emits: [
        { name: 'taskComplete', payload: 'taskId: string' },
        { name: 'taskDelete', payload: 'taskId: string' },
      ],
      useRouter: true,
      useStore: false,
      styling: 'scoped',
    },
    'components/TaskList.vue'
  );

  const vueCode = await processor.process(vueComponentConfig);
  const vueResult = await fileWriter.writeFile(
    { code: vueCode, filePath: vueComponentConfig.outputPath },
    writerConfig
  );

  console.log('Generated:', vueResult.filePath);

  // Example 4: Generate an Angular component
  console.log('\n4. Generating Angular Component...');

  const angularComponentConfig = registry.createTemplateConfig(
    'angular-component',
    {
      componentName: 'DashboardWidget',
      selector: 'app-dashboard-widget',
      inputs: [
        { name: 'title', type: 'string', optional: false },
        { name: 'data', type: 'WidgetData', optional: false },
        { name: 'theme', type: "'light' | 'dark'", optional: true, default: "'light'" },
      ],
      outputs: [
        { name: 'refresh', type: 'void' },
        { name: 'configure', type: 'WidgetConfig' },
      ],
      services: [
        { name: 'DataService', path: '@core/services/data.service' },
        { name: 'ThemeService', path: '@core/services/theme.service' },
      ],
      standalone: true,
      changeDetection: 'OnPush',
      styling: 'scss',
      lifecycle: ['OnInit', 'OnDestroy'],
    },
    'widgets/dashboard-widget.component.ts'
  );

  const angularCode = await processor.process(angularComponentConfig);
  const angularResult = await fileWriter.writeFile(
    { code: angularCode, filePath: angularComponentConfig.outputPath },
    writerConfig
  );

  console.log('Generated:', angularResult.filePath);

  // Example 5: Generate test files
  console.log('\n5. Generating Test Files...');

  const testConfig = registry.createTemplateConfig(
    'shared-test-file',
    {
      testName: 'UserProfile Component',
      testFramework: 'vitest',
      targetFile: '../components/UserProfile',
      imports: ['UserProfile', 'render', 'screen'],
      testCases: [
        {
          name: 'rendering',
          description: 'should render user information correctly',
          arrange: 'const user = { id: "1", name: "John Doe", email: "john@example.com" };',
          act: 'render(<UserProfile user={user} />);',
          assert: 'expect(screen.getByText("John Doe")).toBeInTheDocument();',
        },
        {
          name: 'interactions',
          description: 'should call onEdit when edit button is clicked',
          async: true,
          arrange: 'const onEdit = vi.fn();\nconst user = { id: "1", name: "John Doe" };',
          act: 'render(<UserProfile user={user} onEdit={onEdit} />);\nconst editButton = screen.getByRole("button", { name: /edit/i });\nawait userEvent.click(editButton);',
          assert: 'expect(onEdit).toHaveBeenCalledOnce();',
        },
      ],
    },
    'components/__tests__/UserProfile.test.tsx'
  );

  const testCode = await processor.process(testConfig);
  const testResult = await fileWriter.writeFile(
    { code: testCode, filePath: testConfig.outputPath },
    writerConfig
  );

  console.log('Generated:', testResult.filePath);

  // Example 6: Generate CSS modules
  console.log('\n6. Generating CSS Module...');

  const cssConfig = registry.createTemplateConfig(
    'shared-css-module',
    {
      componentName: 'UserProfile',
      includeResponsive: true,
      includeAnimations: true,
      colorScheme: 'auto',
      baseStyles: [
        { property: 'padding', value: '2rem' },
        { property: 'background-color', value: 'var(--bg-primary)' },
      ],
    },
    'components/UserProfile.module.css'
  );

  const cssCode = await processor.process(cssConfig);
  const cssResult = await fileWriter.writeFile(
    { code: cssCode, filePath: cssConfig.outputPath },
    writerConfig
  );

  console.log('Generated:', cssResult.filePath);

  // Example 7: Find and list available templates
  console.log('\n7. Available Templates by Framework:');

  const templatesByFramework = registry.getTemplatesByFramework();

  for (const [framework, templates] of Object.entries(templatesByFramework)) {
    console.log(`\n${framework.toUpperCase()}:`);
    templates.forEach((template) => {
      console.log(`  - ${template.name} (${template.id})`);
      console.log(`    ${template.description}`);
    });
  }

  // Example 8: Find templates by criteria
  console.log('\n8. Finding TypeScript Component Templates...');

  const tsComponents = registry.findTemplates({
    category: 'component',
    language: 'typescript',
  });

  console.log(`Found ${tsComponents.length} TypeScript component templates:`);
  tsComponents.forEach((template) => {
    console.log(`  - ${template.name} (${template.framework})`);
  });

  // Example 9: Batch generation
  console.log('\n9. Batch Generating Multiple Files...');

  const batchConfigs = [
    // Main component
    {
      templateId: 'react-functional-component',
      variables: {
        componentName: 'TodoItem',
        props: [
          { name: 'todo', type: 'Todo', optional: false },
          { name: 'onToggle', type: '(id: string) => void', optional: false },
          { name: 'onDelete', type: '(id: string) => void', optional: false },
        ],
        useState: false,
        styling: 'css-modules',
      },
      outputPath: 'components/TodoItem/TodoItem.tsx',
    },
    // Component styles
    {
      templateId: 'shared-css-module',
      variables: {
        componentName: 'TodoItem',
        includeAnimations: true,
        colorScheme: 'light',
      },
      outputPath: 'components/TodoItem/TodoItem.module.css',
    },
    // Component tests
    {
      templateId: 'shared-test-file',
      variables: {
        testName: 'TodoItem',
        testFramework: 'vitest',
        targetFile: './TodoItem',
        imports: ['TodoItem'],
      },
      outputPath: 'components/TodoItem/TodoItem.test.tsx',
    },
  ];

  const batchResults = await Promise.all(
    batchConfigs.map(async (config) => {
      const templateConfig = registry.createTemplateConfig(
        config.templateId,
        config.variables,
        config.outputPath
      );
      const code = await processor.process(templateConfig);
      return fileWriter.writeFile({ code, filePath: config.outputPath }, writerConfig);
    })
  );

  console.log('Batch generation complete:');
  batchResults.forEach((result) => {
    console.log(`  - ${result.filePath} (${result.action})`);
  });

  console.log('\n=== Template Generation Complete ===');
}

// Run the demonstration
if (require.main === module) {
  demonstrateTemplateUsage().catch(console.error);
}
