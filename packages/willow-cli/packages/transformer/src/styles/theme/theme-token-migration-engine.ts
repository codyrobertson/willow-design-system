export interface ThemeMigrationConfig {
  colorMapping?: Record<string, string>;
  spacingScale?: number;
  typographyMapping?: Record<string, string>;
}

export class ThemeTokenMigrationEngine {
  migrate(oldTheme: any, config: ThemeMigrationConfig): any {
    const newTheme: any = {};
    
    // Handle circular references
    const seen = new WeakSet();
    
    const migrateValue = (value: any, path: string[]): any => {
      if (value === null || value === undefined) {
        return value;
      }
      
      if (typeof value === 'object') {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
        
        if (Array.isArray(value)) {
          return value.map((item, index) => migrateValue(item, [...path, String(index)]));
        }
        
        const result: any = {};
        
        // First pass: handle unmapped keys
        for (const [key, val] of Object.entries(value)) {
          const newPath = [...path, key];
          const mappedKey = this.getMappedKey(newPath, config);
          
          if (!mappedKey) {
            result[key] = migrateValue(val, newPath);
          }
        }
        
        // Second pass: handle mapped keys (to ensure nested structure is created)
        for (const [key, val] of Object.entries(value)) {
          const newPath = [...path, key];
          const mappedKey = this.getMappedKey(newPath, config);
          
          if (mappedKey) {
            const migratedValue = migrateValue(val, newPath);
            this.setNestedValue(result, mappedKey, migratedValue);
          }
        }
        
        return result;
      }
      
      // Apply value transformations
      if (path[0] === 'spacing' && config.spacingScale) {
        return this.transformSpacingValue(value, config.spacingScale);
      }
      
      return value;
    };
    
    return migrateValue(oldTheme, []);
  }
  
  private getMappedKey(path: string[], config: ThemeMigrationConfig): string | null {
    const pathStr = path.join('.');
    
    // Check color mappings
    if (path[0] === 'colors' && config.colorMapping) {
      const colorKey = path.slice(1).join('.');
      if (config.colorMapping[colorKey]) {
        return config.colorMapping[colorKey];
      }
    }
    
    // Check typography mappings
    if (path[0] === 'typography' && config.typographyMapping) {
      const typographyKey = path[1];
      if (config.typographyMapping[typographyKey]) {
        return config.typographyMapping[typographyKey];
      }
    }
    
    // Map spacing to space
    if (path[0] === 'spacing') {
      const spacingKey = path.slice(1).join('.');
      return spacingKey ? `space.${spacingKey}` : 'space';
    }
    
    return null;
  }
  
  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key]) {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
  }
  
  private transformSpacingValue(value: any, scale: number): any {
    if (typeof value === 'string' && value.endsWith('px')) {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        return `${numValue / scale}rem`;
      }
    }
    return value;
  }
}