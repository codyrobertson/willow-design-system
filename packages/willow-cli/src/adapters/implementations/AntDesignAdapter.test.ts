import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AntDesignAdapter } from './AntDesignAdapter';
import { AdapterError } from '../errors';

describe('AntDesignAdapter', () => {
  let adapter: AntDesignAdapter;

  beforeEach(() => {
    adapter = new AntDesignAdapter();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await expect(adapter.initialize()).resolves.not.toThrow();
      expect(adapter.initialized).toBe(true);
    });

    it('should throw error on double initialization', async () => {
      await adapter.initialize();
      await expect(adapter.initialize()).rejects.toThrow('Adapter already initialized');
    });

    it('should have Ant Design capabilities', () => {
      expect(adapter.config.capabilities).toContain('enterprise-components');
      expect(adapter.config.capabilities).toContain('form-integration');
      expect(adapter.config.capabilities).toContain('config-provider');
      expect(adapter.config.capabilities).toContain('theme-customization');
      expect(adapter.config.capabilities).toContain('internationalization');
      expect(adapter.config.capabilities).toContain('accessibility');
      expect(adapter.config.capabilities).toContain('responsive-design');
      expect(adapter.config.capabilities).toContain('css-in-js');
      expect(adapter.config.capabilities).toContain('design-tokens');
    });

    it('should use CSS-in-JS styling by default', () => {
      expect(adapter.config.options?.styling?.cssInJs).toBe(true);
      expect(adapter.config.options?.styling?.customizable).toBe(true);
      expect(adapter.config.options?.styling?.theme).toBe('antd');
    });

    it('should support enterprise features by default', () => {
      expect(adapter.config.options?.enterprise?.formValidation).toBe(true);
      expect(adapter.config.options?.enterprise?.dataVisualization).toBe(true);
      expect(adapter.config.options?.enterprise?.tableFeatures).toBe(true);
    });

    it('should allow custom configuration', () => {
      const customAdapter = new AntDesignAdapter({
        options: { 
          styling: { 
            cssInJs: false,
            customizable: false,
          } 
        }
      });
      const config = customAdapter.config;
      expect(config.options?.styling?.cssInJs).toBe(false);
      expect(config.options?.styling?.customizable).toBe(false);
    });
  });

  describe('mapComponent', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    describe('General components', () => {
      it('should map Button component with variants', () => {
        const result = adapter.mapComponent('Button', {
          children: 'Click me',
          type: 'primary',
          size: 'large',
          danger: true,
          onClick: vi.fn(),
        });

        expect(result.component).toBe('Button');
        expect(result.props?.children).toBe('Click me');
        expect(result.props?.type).toBe('primary');
        expect(result.props?.size).toBe('large');
        expect(result.props?.danger).toBe(true);
        expect(result.props?.onClick).toBeDefined();
        expect(result.props?.htmlType).toBe('button');
        expect(result.metadata?.originalComponent).toBe('Button');
        expect(result.metadata?.adapterType).toBe('antd');
        expect(result.metadata?.antdImport).toBe('antd/es/button');
        expect(result.metadata?.category).toBe('general');
        expect(result.metadata?.enterprise).toBe(true);
        expect(result.metadata?.variants).toEqual({
          type: ['default', 'primary', 'dashed', 'text', 'link'],
          shape: ['default', 'circle', 'round'],
          danger: [true, false],
          ghost: [true, false],
        });
      });

      it('should validate Button variants', () => {
        expect(() => {
          adapter.mapComponent('Button', {
            type: 'invalid-type',
          });
        }).toThrow('Invalid type "invalid-type" for Button');
      });

      it('should validate Button sizes', () => {
        expect(() => {
          adapter.mapComponent('Button', {
            size: 'invalid-size',
          });
        }).toThrow('Invalid size "invalid-size" for Button');
      });

      it('should map Typography component', () => {
        const result = adapter.mapComponent('Typography', {
          children: 'Text content',
          type: 'secondary',
        });

        expect(result.component).toBe('Typography');
        expect(result.props?.children).toBe('Text content');
        expect(result.props?.type).toBe('secondary');
        expect(result.metadata?.antdImport).toBe('antd/es/typography');
        expect(result.metadata?.variants?.type).toContain('secondary');
      });

      it('should map Icon component', () => {
        const result = adapter.mapComponent('Icon', {
          spin: true,
          rotate: 90,
        });

        expect(result.component).toBe('Icon');
        expect(result.props?.spin).toBe(true);
        expect(result.props?.rotate).toBe(90);
        expect(result.metadata?.antdImport).toBe('@ant-design/icons');
      });
    });

    describe('Layout components', () => {
      it('should map Layout component', () => {
        const result = adapter.mapComponent('Layout', {
          children: 'Layout content',
        });

        expect(result.component).toBe('Layout');
        expect(result.props?.children).toBe('Layout content');
        expect(result.metadata?.antdImport).toBe('antd/es/layout');
        expect(result.metadata?.category).toBe('layout');
        expect(result.metadata?.responsive).toBe(true);
      });

      it('should map Grid component', () => {
        const result = adapter.mapComponent('Grid', {
          gutter: 16,
          justify: 'center',
          align: 'middle',
        });

        expect(result.component).toBe('Row');
        expect(result.props?.gutter).toBe(16);
        expect(result.props?.justify).toBe('center');
        expect(result.props?.align).toBe('middle');
        expect(result.props?.wrap).toBe(true); // Default value
        expect(result.metadata?.antdImport).toBe('antd/es/grid');
        expect(result.metadata?.responsive).toBe(true);
      });

      it('should map Space component with sizes', () => {
        const result = adapter.mapComponent('Space', {
          direction: 'vertical',
          size: 'large',
          wrap: true,
        });

        expect(result.component).toBe('Space');
        expect(result.props?.direction).toBe('vertical');
        expect(result.props?.size).toBe('large');
        expect(result.props?.wrap).toBe(true);
        expect(result.metadata?.sizes).toEqual(['small', 'middle', 'large']);
      });
    });

    describe('Navigation components', () => {
      it('should map Menu component with theme variants', () => {
        const result = adapter.mapComponent('Menu', {
          mode: 'horizontal',
          theme: 'dark',
          items: [],
        });

        expect(result.component).toBe('Menu');
        expect(result.props?.mode).toBe('horizontal');
        expect(result.props?.theme).toBe('dark');
        expect(result.props?.selectable).toBe(true); // Default
        expect(result.metadata?.variants?.mode).toEqual(['vertical', 'horizontal', 'inline']);
        expect(result.metadata?.variants?.theme).toEqual(['light', 'dark']);
        expect(result.metadata?.accessibility).toBe(true);
      });

      it('should map Breadcrumb component', () => {
        const result = adapter.mapComponent('Breadcrumb', {
          items: [{ title: 'Home' }, { title: 'List' }],
        });

        expect(result.component).toBe('Breadcrumb');
        expect(result.props?.items).toHaveLength(2);
        expect(result.props?.separator).toBe('/'); // Default
        expect(result.metadata?.accessibility).toBe(true);
      });

      it('should map Pagination with locale support', () => {
        const result = adapter.mapComponent('Pagination', {
          current: 1,
          total: 500,
          pageSize: 20,
          showSizeChanger: true,
        });

        expect(result.component).toBe('Pagination');
        expect(result.props?.current).toBe(1);
        expect(result.props?.total).toBe(500);
        expect(result.props?.pageSize).toBe(20);
        expect(result.props?.showSizeChanger).toBe(true);
        expect(result.metadata?.locale).toBe(true);
        expect(result.metadata?.accessibility).toBe(true);
      });

      it('should map Steps with variants', () => {
        const result = adapter.mapComponent('Steps', {
          current: 1,
          direction: 'vertical',
          size: 'small',
          status: 'error',
        });

        expect(result.component).toBe('Steps');
        expect(result.props?.current).toBe(1);
        expect(result.props?.direction).toBe('vertical');
        expect(result.props?.size).toBe('small');
        expect(result.props?.status).toBe('error');
        expect(result.metadata?.responsive).toBe(true);
      });
    });

    describe('Data Entry components', () => {
      it('should map Form component with layout variants', () => {
        const result = adapter.mapComponent('Form', {
          layout: 'vertical',
          size: 'large',
          onFinish: vi.fn(),
        });

        expect(result.component).toBe('Form');
        expect(result.props?.layout).toBe('vertical');
        expect(result.props?.size).toBe('large');
        expect(result.props?.onFinish).toBeDefined();
        expect(result.props?.requiredMark).toBe(true); // Default
        expect(result.metadata?.formIntegration).toBeUndefined(); // Form itself doesn't have form integration
        expect(result.metadata?.variants?.layout).toEqual(['horizontal', 'vertical', 'inline']);
      });

      it('should map Input with form integration', () => {
        const result = adapter.mapComponent('Input', {
          placeholder: 'Enter text',
          size: 'large',
          variant: 'filled',
          name: 'username',
          label: 'Username',
          required: true,
        });

        expect(result.component).toBe('Input');
        expect(result.props?.placeholder).toBe('Enter text');
        expect(result.props?.size).toBe('large');
        expect(result.props?.variant).toBe('filled');
        expect(result.props?.allowClear).toBe(false); // Default
        expect(result.metadata?.formIntegration).toEqual({
          formItem: true,
          formItemProps: {
            name: 'username',
            label: 'Username',
            required: true,
          },
          validation: {
            required: true,
          },
        });
      });

      it('should map Select with form integration and variants', () => {
        const result = adapter.mapComponent('Select', {
          options: [{ value: '1', label: 'Option 1' }],
          mode: 'multiple',
          variant: 'borderless',
          name: 'items',
          rules: [{ required: true, message: 'Please select' }],
        });

        expect(result.component).toBe('Select');
        expect(result.props?.options).toHaveLength(1);
        expect(result.props?.mode).toBe('multiple');
        expect(result.props?.variant).toBe('borderless');
        expect(result.props?.virtual).toBe(true); // Default
        expect(result.metadata?.formIntegration?.formItemProps?.name).toBe('items');
        expect(result.metadata?.formIntegration?.validation?.rules).toHaveLength(1);
      });

      it('should map Checkbox with form integration', () => {
        const result = adapter.mapComponent('Checkbox', {
          checked: true,
          name: 'agree',
          label: 'I agree',
        });

        expect(result.component).toBe('Checkbox');
        expect(result.props?.checked).toBe(true);
        expect(result.props?.defaultChecked).toBe(false); // Default
        expect(result.metadata?.formIntegration?.formItemProps?.name).toBe('agree');
      });

      it('should map Radio with variants', () => {
        const result = adapter.mapComponent('Radio', {
          optionType: 'button',
          buttonStyle: 'solid',
          size: 'large',
          name: 'choice',
        });

        expect(result.component).toBe('Radio');
        expect(result.props?.optionType).toBe('button');
        expect(result.props?.buttonStyle).toBe('solid');
        expect(result.props?.size).toBe('large');
        expect(result.metadata?.variants?.optionType).toEqual(['default', 'button']);
        expect(result.metadata?.variants?.buttonStyle).toEqual(['outline', 'solid']);
      });

      it('should map Switch with form integration', () => {
        const result = adapter.mapComponent('Switch', {
          checked: false,
          size: 'small',
          loading: true,
          name: 'enabled',
        });

        expect(result.component).toBe('Switch');
        expect(result.props?.checked).toBe(false);
        expect(result.props?.size).toBe('small');
        expect(result.props?.loading).toBe(true);
        expect(result.metadata?.formIntegration?.formItemProps?.name).toBe('enabled');
      });

      it('should map DatePicker with locale and variants', () => {
        const result = adapter.mapComponent('DatePicker', {
          picker: 'month',
          variant: 'filled',
          size: 'large',
          name: 'birthDate',
        });

        expect(result.component).toBe('DatePicker');
        expect(result.props?.picker).toBe('month');
        expect(result.props?.variant).toBe('filled');
        expect(result.props?.size).toBe('large');
        expect(result.props?.allowClear).toBe(true); // Default
        expect(result.metadata?.locale).toBe(true);
        expect(result.metadata?.variants?.picker).toContain('month');
      });

      it('should map Upload component', () => {
        const result = adapter.mapComponent('Upload', {
          listType: 'picture-card',
          multiple: true,
          action: '/upload',
          name: 'files',
        });

        expect(result.component).toBe('Upload');
        expect(result.props?.listType).toBe('picture-card');
        expect(result.props?.multiple).toBe(true);
        expect(result.props?.action).toBe('/upload');
        expect(result.props?.showUploadList).toBe(true); // Default
        expect(result.metadata?.variants?.listType).toContain('picture-card');
      });
    });

    describe('Data Display components', () => {
      it('should map Table with enterprise features', () => {
        const result = adapter.mapComponent('Table', {
          dataSource: [],
          columns: [],
          size: 'middle',
          bordered: true,
          pagination: false,
        });

        expect(result.component).toBe('Table');
        expect(result.props?.dataSource).toEqual([]);
        expect(result.props?.columns).toEqual([]);
        expect(result.props?.size).toBe('middle');
        expect(result.props?.bordered).toBe(true);
        expect(result.props?.pagination).toBe(false);
        expect(result.props?.showHeader).toBe(true); // Default
        expect(result.metadata?.responsive).toBe(true);
        expect(result.metadata?.locale).toBe(true);
        expect(result.metadata?.accessibility).toBe(true);
      });

      it('should map Tag with color variants', () => {
        const result = adapter.mapComponent('Tag', {
          color: 'success',
          closable: true,
          children: 'Success',
        });

        expect(result.component).toBe('Tag');
        expect(result.props?.color).toBe('success');
        expect(result.props?.closable).toBe(true);
        expect(result.props?.children).toBe('Success');
        expect(result.metadata?.variants?.color).toContain('success');
      });

      it('should map Card with variants', () => {
        const result = adapter.mapComponent('Card', {
          title: 'Card Title',
          size: 'small',
          type: 'inner',
          hoverable: true,
        });

        expect(result.component).toBe('Card');
        expect(result.props?.title).toBe('Card Title');
        expect(result.props?.size).toBe('small');
        expect(result.props?.type).toBe('inner');
        expect(result.props?.hoverable).toBe(true);
        expect(result.props?.bordered).toBe(true); // Default
      });

      it('should map Avatar with shape variants', () => {
        const result = adapter.mapComponent('Avatar', {
          src: '/avatar.jpg',
          shape: 'square',
          size: 'large',
        });

        expect(result.component).toBe('Avatar');
        expect(result.props?.src).toBe('/avatar.jpg');
        expect(result.props?.shape).toBe('square');
        expect(result.props?.size).toBe('large');
        expect(result.metadata?.variants?.shape).toEqual(['circle', 'square']);
      });

      it('should map Badge with status variants', () => {
        const result = adapter.mapComponent('Badge', {
          count: 5,
          status: 'processing',
          showZero: true,
        });

        expect(result.component).toBe('Badge');
        expect(result.props?.count).toBe(5);
        expect(result.props?.status).toBe('processing');
        expect(result.props?.showZero).toBe(true);
        expect(result.metadata?.variants?.status).toContain('processing');
      });

      it('should map Descriptions with responsive layout', () => {
        const result = adapter.mapComponent('Descriptions', {
          title: 'User Info',
          layout: 'vertical',
          size: 'small',
          bordered: true,
        });

        expect(result.component).toBe('Descriptions');
        expect(result.props?.title).toBe('User Info');
        expect(result.props?.layout).toBe('vertical');
        expect(result.props?.size).toBe('small');
        expect(result.props?.bordered).toBe(true);
        expect(result.props?.colon).toBe(true); // Default
        expect(result.metadata?.responsive).toBe(true);
      });

      it('should map List with locale support', () => {
        const result = adapter.mapComponent('List', {
          dataSource: [],
          size: 'small',
          bordered: true,
          split: false,
        });

        expect(result.component).toBe('List');
        expect(result.props?.dataSource).toEqual([]);
        expect(result.props?.size).toBe('small');
        expect(result.props?.bordered).toBe(true);
        expect(result.props?.split).toBe(false);
        expect(result.metadata?.locale).toBe(true);
      });

      it('should map Tree with accessibility', () => {
        const result = adapter.mapComponent('Tree', {
          treeData: [],
          checkable: true,
          selectable: false,
          multiple: true,
        });

        expect(result.component).toBe('Tree');
        expect(result.props?.treeData).toEqual([]);
        expect(result.props?.checkable).toBe(true);
        expect(result.props?.selectable).toBe(false);
        expect(result.props?.multiple).toBe(true);
        expect(result.props?.showLine).toBe(false); // Default
        expect(result.metadata?.accessibility).toBe(true);
      });
    });

    describe('Feedback components', () => {
      it('should map Alert with type variants', () => {
        const result = adapter.mapComponent('Alert', {
          message: 'Alert message',
          type: 'warning',
          closable: true,
          showIcon: true,
        });

        expect(result.component).toBe('Alert');
        expect(result.props?.message).toBe('Alert message');
        expect(result.props?.type).toBe('warning');
        expect(result.props?.closable).toBe(true);
        expect(result.props?.showIcon).toBe(true);
        expect(result.metadata?.variants?.type).toEqual(['success', 'info', 'warning', 'error']);
      });

      it('should map Modal with config provider support', () => {
        const result = adapter.mapComponent('Modal', {
          title: 'Modal Title',
          open: true,
          onOk: vi.fn(),
          onCancel: vi.fn(),
          centered: true,
        });

        expect(result.component).toBe('Modal');
        expect(result.props?.title).toBe('Modal Title');
        expect(result.props?.open).toBe(true);
        expect(result.props?.onOk).toBeDefined();
        expect(result.props?.onCancel).toBeDefined();
        expect(result.props?.centered).toBe(true);
        expect(result.props?.mask).toBe(true); // Default
        expect(result.metadata?.locale).toBe(true);
        expect(result.metadata?.accessibility).toBe(true);
      });

      it('should map Progress with variants', () => {
        const result = adapter.mapComponent('Progress', {
          percent: 75,
          type: 'circle',
          status: 'active',
          size: 'small',
        });

        expect(result.component).toBe('Progress');
        expect(result.props?.percent).toBe(75);
        expect(result.props?.type).toBe('circle');
        expect(result.props?.status).toBe('active');
        expect(result.props?.size).toBe('small');
        expect(result.props?.showInfo).toBe(true); // Default
        expect(result.metadata?.variants?.type).toEqual(['line', 'circle', 'dashboard']);
        expect(result.metadata?.variants?.status).toContain('active');
      });

      it('should map Spin with sizes', () => {
        const result = adapter.mapComponent('Spin', {
          size: 'large',
          spinning: false,
          delay: 500,
        });

        expect(result.component).toBe('Spin');
        expect(result.props?.size).toBe('large');
        expect(result.props?.spinning).toBe(false);
        expect(result.props?.delay).toBe(500);
        expect(result.metadata?.sizes).toEqual(['small', 'default', 'large']);
      });

      it('should map Skeleton component', () => {
        const result = adapter.mapComponent('Skeleton', {
          active: true,
          loading: true,
          paragraph: { rows: 4 },
        });

        expect(result.component).toBe('Skeleton');
        expect(result.props?.active).toBe(true);
        expect(result.props?.loading).toBe(true);
        expect(result.props?.paragraph).toEqual({ rows: 4 });
        expect(result.props?.title).toBe(true); // Default
      });

      it('should map Result with status variants', () => {
        const result = adapter.mapComponent('Result', {
          status: '404',
          title: 'Page Not Found',
          subTitle: 'Sorry, the page you visited does not exist.',
        });

        expect(result.component).toBe('Result');
        expect(result.props?.status).toBe('404');
        expect(result.props?.title).toBe('Page Not Found');
        expect(result.props?.subTitle).toBe('Sorry, the page you visited does not exist.');
        expect(result.metadata?.variants?.status).toContain('404');
      });
    });

    describe('Other components', () => {
      it('should map Anchor with accessibility', () => {
        const result = adapter.mapComponent('Anchor', {
          items: [{ key: 'part-1', href: '#part-1', title: 'Part 1' }],
          offsetTop: 100,
        });

        expect(result.component).toBe('Anchor');
        expect(result.props?.items).toHaveLength(1);
        expect(result.props?.offsetTop).toBe(100);
        expect(result.props?.bounds).toBe(5); // Default
        expect(result.metadata?.accessibility).toBe(true);
      });

      it('should map BackTop component', () => {
        const result = adapter.mapComponent('BackTop', {
          visibilityHeight: 500,
          onClick: vi.fn(),
        });

        expect(result.component).toBe('BackTop');
        expect(result.props?.visibilityHeight).toBe(500);
        expect(result.props?.onClick).toBeDefined();
        expect(result.metadata?.accessibility).toBe(true);
      });

      it('should map ConfigProvider', () => {
        const result = adapter.mapComponent('ConfigProvider', {
          theme: { token: { colorPrimary: '#00b96b' } },
          locale: {},
        });

        expect(result.component).toBe('ConfigProvider');
        expect(result.props?.theme).toEqual({ token: { colorPrimary: '#00b96b' } });
        expect(result.props?.locale).toEqual({});
        expect(result.metadata?.locale).toBe(true);
      });
    });

    it('should handle unknown components as fallback', () => {
      const result = adapter.mapComponent('UnknownComponent', {
        prop1: 'value1',
      });

      expect(result).toEqual({
        component: 'UnknownComponent',
        props: { prop1: 'value1' },
        metadata: {
          originalComponent: 'UnknownComponent',
          adapterType: 'antd',
          fallback: true,
          enterprise: false,
        },
      });
    });

    it('should throw error when not initialized', () => {
      const uninitializedAdapter = new AntDesignAdapter();
      expect(() => 
        uninitializedAdapter.mapComponent('Button', {})
      ).toThrow('Adapter not initialized');
    });
  });

  describe('translateStyles', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should translate styles to Ant Design theme token format', () => {
      const styles = {
        base: {
          padding: '16px',
          margin: '8px',
        },
        colors: {
          backgroundColor: '#f0f0f0',
          color: '#333333',
          primary: '#1677ff',
        },
        spacing: {
          padding: '12px',
          margin: '6px',
        },
        borders: {
          borderRadius: '8px',
          borderWidth: '2px',
        },
        typography: {
          fontSize: '16px',
          fontFamily: 'Inter, sans-serif',
          lineHeight: 1.5,
        },
        className: 'custom-class',
      };

      const result = adapter.translateStyles(styles);
      
      expect(result).toEqual({
        token: {
          colorBgBase: '#f0f0f0',
          colorText: '#333333',
          colorPrimary: '#1677ff',
          padding: '12px',
          margin: '6px',
          borderRadius: '8px',
          lineWidth: '2px',
          fontSize: '16px',
          fontFamily: 'Inter, sans-serif',
          lineHeight: 1.5,
        },
        className: 'custom-class',
        style: {
          padding: '16px',
          margin: '8px',
        },
      });
    });

    it('should handle empty styles config', () => {
      const result = adapter.translateStyles({});
      expect(result).toEqual({});
    });

    it('should handle styles with only className', () => {
      const styles = {
        className: 'utility-classes',
      };

      const result = adapter.translateStyles(styles);
      expect(result).toEqual({
        className: 'utility-classes',
      });
    });
  });

  describe('convertTokens', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should convert tokens to Ant Design theme configuration', () => {
      const tokens = {
        category: 'all',
        path: 'tokens',
        value: 'all',
        tokens: {
          colors: {
            primary: {
              main: '#1677ff',
              500: '#1677ff',
            },
            error: '#ff4d4f',
            warning: '#faad14',
            success: '#52c41a',
            info: '#1890ff',
          },
          spacing: {
            xs: '4px',
            sm: '8px',
            md: '16px',
            lg: '24px',
            xl: '32px',
          },
          typography: {
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            lineHeight: 1.5,
            heading: {
              fontSize: '24px',
              lineHeight: 1.2,
            },
          },
          borders: {
            radius: '6px',
            width: '1px',
            small: {
              radius: '4px',
            },
            large: {
              radius: '8px',
            },
          },
        },
      };

      const result = adapter.convertTokens(tokens);
      
      expect(result.themeConfig.token).toEqual({
        colorPrimary: '#1677ff',
        colorError: '#ff4d4f',
        colorWarning: '#faad14',
        colorSuccess: '#52c41a',
        colorInfo: '#1890ff',
        paddingXS: '4px',
        marginXS: '4px',
        paddingSM: '8px',
        marginSM: '8px',
        padding: '16px',
        margin: '16px',
        paddingLG: '24px',
        marginLG: '24px',
        paddingXL: '32px',
        marginXL: '32px',
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        lineHeight: 1.5,
        fontSizeHeading1: '24px',
        lineHeightHeading1: 1.2,
        borderRadius: '6px',
        lineWidth: '1px',
        borderRadiusSM: '4px',
        borderRadiusLG: '8px',
      });
    });

    it('should handle simple color tokens', () => {
      const tokens = {
        category: 'colors',
        path: 'colors',
        value: 'all',
        tokens: {
          colors: {
            primary: '#1677ff',
            error: '#ff4d4f',
          },
        },
      };

      const result = adapter.convertTokens(tokens);
      expect(result.themeConfig.token).toEqual({
        colorPrimary: '#1677ff',
        colorError: '#ff4d4f',
      });
    });
  });

  describe('Ant Design-specific methods', () => {
    it('should get all available components', () => {
      const components = adapter.getAvailableComponents();
      
      // General components
      expect(components).toContain('Button');
      expect(components).toContain('Icon');
      expect(components).toContain('Typography');
      
      // Layout components
      expect(components).toContain('Layout');
      expect(components).toContain('Grid');
      expect(components).toContain('Space');
      
      // Navigation components
      expect(components).toContain('Menu');
      expect(components).toContain('Breadcrumb');
      expect(components).toContain('Pagination');
      expect(components).toContain('Steps');
      
      // Data Entry components
      expect(components).toContain('Form');
      expect(components).toContain('Input');
      expect(components).toContain('Select');
      expect(components).toContain('Checkbox');
      expect(components).toContain('Radio');
      expect(components).toContain('Switch');
      expect(components).toContain('DatePicker');
      expect(components).toContain('Upload');
      
      // Data Display components
      expect(components).toContain('Table');
      expect(components).toContain('Tag');
      expect(components).toContain('Card');
      expect(components).toContain('Avatar');
      expect(components).toContain('Badge');
      expect(components).toContain('Descriptions');
      expect(components).toContain('List');
      expect(components).toContain('Tree');
      
      // Feedback components
      expect(components).toContain('Alert');
      expect(components).toContain('Modal');
      expect(components).toContain('Message');
      expect(components).toContain('Notification');
      expect(components).toContain('Progress');
      expect(components).toContain('Spin');
      expect(components).toContain('Skeleton');
      expect(components).toContain('Result');
      
      // Other components
      expect(components).toContain('Anchor');
      expect(components).toContain('BackTop');
      expect(components).toContain('ConfigProvider');
      
      expect(components.length).toBeGreaterThan(30);
    });

    it('should get components by category', () => {
      const generalComponents = adapter.getComponentsByCategory('general');
      const layoutComponents = adapter.getComponentsByCategory('layout');
      const navigationComponents = adapter.getComponentsByCategory('navigation');
      const dataEntryComponents = adapter.getComponentsByCategory('data-entry');
      const dataDisplayComponents = adapter.getComponentsByCategory('data-display');
      const feedbackComponents = adapter.getComponentsByCategory('feedback');
      const otherComponents = adapter.getComponentsByCategory('other');
      
      expect(generalComponents).toContain('Button');
      expect(generalComponents).toContain('Icon');
      expect(generalComponents).toContain('Typography');
      
      expect(layoutComponents).toContain('Layout');
      expect(layoutComponents).toContain('Grid');
      expect(layoutComponents).toContain('Space');
      
      expect(navigationComponents).toContain('Menu');
      expect(navigationComponents).toContain('Breadcrumb');
      
      expect(dataEntryComponents).toContain('Form');
      expect(dataEntryComponents).toContain('Input');
      
      expect(dataDisplayComponents).toContain('Table');
      expect(dataDisplayComponents).toContain('Card');
      
      expect(feedbackComponents).toContain('Alert');
      expect(feedbackComponents).toContain('Modal');
      
      expect(otherComponents).toContain('Anchor');
      expect(otherComponents).toContain('ConfigProvider');
    });

    it('should get component import paths', () => {
      expect(adapter.getComponentImport('Button')).toBe('antd/es/button');
      expect(adapter.getComponentImport('Form')).toBe('antd/es/form');
      expect(adapter.getComponentImport('Table')).toBe('antd/es/table');
      expect(adapter.getComponentImport('Icon')).toBe('@ant-design/icons');
      expect(adapter.getComponentImport('UnknownComponent')).toBeUndefined();
    });

    it('should get available themes', () => {
      const themes = adapter.getAvailableThemes();
      
      expect(themes).toContain('default');
      expect(themes).toContain('dark');
      expect(themes).toContain('compact');
      expect(themes).toHaveLength(3);
    });

    it('should get theme configuration', () => {
      const defaultTheme = adapter.getThemeConfig('default');
      expect(defaultTheme).toEqual({
        algorithm: 'default',
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 6,
          wireframe: false,
        },
        cssVar: false,
        hashed: true,
      });

      const darkTheme = adapter.getThemeConfig('dark');
      expect(darkTheme?.algorithm).toBe('dark');

      expect(adapter.getThemeConfig('unknown')).toBeUndefined();
    });

    it('should check if component supports Form.Item wrapper', () => {
      expect(adapter.supportsFormItem('Input')).toBe(true);
      expect(adapter.supportsFormItem('Select')).toBe(true);
      expect(adapter.supportsFormItem('Checkbox')).toBe(true);
      expect(adapter.supportsFormItem('Form')).toBe(false);
      expect(adapter.supportsFormItem('Button')).toBe(false);
      expect(adapter.supportsFormItem('UnknownComponent')).toBe(false);
    });

    it('should check if component supports ConfigProvider', () => {
      expect(adapter.supportsConfigProvider('Form')).toBe(true);
      expect(adapter.supportsConfigProvider('Modal')).toBe(true);
      expect(adapter.supportsConfigProvider('Message')).toBe(true);
      expect(adapter.supportsConfigProvider('ConfigProvider')).toBe(true);
      expect(adapter.supportsConfigProvider('Button')).toBe(false);
      expect(adapter.supportsConfigProvider('UnknownComponent')).toBe(false);
    });

    it('should get component variants', () => {
      const buttonVariants = adapter.getComponentVariants('Button');
      expect(buttonVariants).toEqual({
        type: ['default', 'primary', 'dashed', 'text', 'link'],
        shape: ['default', 'circle', 'round'],
        danger: [true, false],
        ghost: [true, false],
      });

      const selectVariants = adapter.getComponentVariants('Select');
      expect(selectVariants?.variant).toEqual(['outlined', 'borderless', 'filled']);
      expect(selectVariants?.mode).toEqual(['multiple', 'tags']);

      expect(adapter.getComponentVariants('UnknownComponent')).toBeUndefined();
    });

    it('should get component sizes', () => {
      expect(adapter.getComponentSizes('Button')).toEqual(['large', 'middle', 'small']);
      expect(adapter.getComponentSizes('Input')).toEqual(['large', 'middle', 'small']);
      expect(adapter.getComponentSizes('Space')).toEqual(['small', 'middle', 'large']);
      expect(adapter.getComponentSizes('UnknownComponent')).toBeUndefined();
    });

    it('should check if component supports theming', () => {
      expect(adapter.supportsTheming('Button')).toBe(true);
      expect(adapter.supportsTheming('Input')).toBe(true);
      expect(adapter.supportsTheming('Card')).toBe(true);
      expect(adapter.supportsTheming('Layout')).toBe(true);
      expect(adapter.supportsTheming('UnknownComponent')).toBe(false);
    });

    it('should check if component supports internationalization', () => {
      expect(adapter.supportsLocale('DatePicker')).toBe(true);
      expect(adapter.supportsLocale('Table')).toBe(true);
      expect(adapter.supportsLocale('Pagination')).toBe(true);
      expect(adapter.supportsLocale('Modal')).toBe(true);
      expect(adapter.supportsLocale('Button')).toBe(false);
      expect(adapter.supportsLocale('UnknownComponent')).toBe(false);
    });

    it('should check if component is responsive', () => {
      expect(adapter.isResponsive('Layout')).toBe(true);
      expect(adapter.isResponsive('Grid')).toBe(true);
      expect(adapter.isResponsive('Table')).toBe(true);
      expect(adapter.isResponsive('Steps')).toBe(true);
      expect(adapter.isResponsive('Button')).toBe(false);
      expect(adapter.isResponsive('UnknownComponent')).toBe(false);
    });

    it('should check if component supports accessibility features', () => {
      expect(adapter.supportsAccessibility('Button')).toBe(true);
      expect(adapter.supportsAccessibility('Menu')).toBe(true);
      expect(adapter.supportsAccessibility('Table')).toBe(true);
      expect(adapter.supportsAccessibility('Modal')).toBe(true);
      expect(adapter.supportsAccessibility('Icon')).toBe(true);
      expect(adapter.supportsAccessibility('UnknownComponent')).toBe(false);
    });
  });

  describe('validateConfig', () => {
    it('should validate valid config', () => {
      const result = adapter.validateConfig();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing configuration', () => {
      const invalidAdapter = new AntDesignAdapter({ name: '', version: '' });
      const result = invalidAdapter.validateConfig();
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'MISSING_NAME',
          message: 'Adapter name is required',
        })
      );
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'MISSING_VERSION',
          message: 'Adapter version is required',
        })
      );
    });

    it('should warn about non-CSS-in-JS mode', () => {
      const nonCssInJsAdapter = new AntDesignAdapter({
        options: { styling: { cssInJs: false } }
      });
      const result = nonCssInJsAdapter.validateConfig();
      
      expect(result.valid).toBe(true);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          code: 'CSS_IN_JS_RECOMMENDED',
          message: 'CSS-in-JS is recommended for Ant Design theming',
        })
      );
    });
  });

  describe('cleanup', () => {
    it('should cleanup successfully', async () => {
      await adapter.initialize();
      expect(adapter.initialized).toBe(true);
      
      await adapter.cleanup();
      expect(adapter.initialized).toBe(false);
    });
  });
});