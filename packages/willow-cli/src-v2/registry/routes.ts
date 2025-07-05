/**
 * Registry API Routes
 */

import { Router, Request, Response } from 'express';
import { ComponentMetadata, Component, SearchOptions } from '../types';
import { ComponentStorage } from './storage';
import { SearchEngine } from './search-engine';
import { AnalyticsTracker } from './analytics';
import { validateComponent, validateSearchQuery } from './validators';

export const registryRouter = Router();

const storage = new ComponentStorage();
const searchEngine = new SearchEngine();
const analytics = new AnalyticsTracker();

/**
 * GET /components - List all components
 */
registryRouter.get('/components', async (req: Request, res: Response) => {
  try {
    const { category, framework, limit = 50, offset = 0 } = req.query;
    
    const components = await storage.listComponents({
      category: category as string,
      framework: framework as string,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10)
    });
    
    res.json({ components });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to list components',
      message: (error as Error).message 
    });
  }
});

/**
 * GET /components/:name - Get specific component
 */
registryRouter.get('/components/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const { version } = req.query;
    
    const component = await storage.getComponent(name, version as string);
    
    if (!component) {
      return res.status(404).json({ 
        error: 'Component not found',
        name 
      });
    }
    
    // Track download
    await analytics.trackDownload(name, version as string);
    
    res.json(component);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get component',
      message: (error as Error).message 
    });
  }
});

/**
 * POST /components - Publish new component
 */
registryRouter.post('/components', async (req: Request, res: Response) => {
  try {
    // Validate auth
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Validate component data
    const validation = validateComponent(req.body);
    if (!validation.valid) {
      return res.status(400).json({ 
        error: 'Invalid component data',
        errors: validation.errors 
      });
    }
    
    const component: Component = req.body;
    
    // Check if component already exists
    const existing = await storage.getComponent(component.metadata.name);
    if (existing && existing.metadata.version === component.metadata.version) {
      return res.status(409).json({ 
        error: 'Component version already exists',
        name: component.metadata.name,
        version: component.metadata.version
      });
    }
    
    // Store component
    const result = await storage.storeComponent(component, {
      userId: req.user?.id,
      private: req.body.private
    });
    
    // Index for search
    await searchEngine.indexComponent(component);
    
    // Track publish
    await analytics.trackPublish(component.metadata.name, component.metadata.version);
    
    res.status(201).json({
      success: true,
      id: result.id,
      url: `${req.protocol}://${req.get('host')}/components/${component.metadata.name}`
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to publish component',
      message: (error as Error).message 
    });
  }
});

/**
 * PUT /components/:name - Update component
 */
registryRouter.put('/components/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Check ownership
    const existing = await storage.getComponent(name);
    if (!existing) {
      return res.status(404).json({ error: 'Component not found' });
    }
    
    // Update component
    const updated = await storage.updateComponent(name, req.body);
    
    // Re-index for search
    await searchEngine.indexComponent(updated);
    
    res.json({
      success: true,
      component: updated
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to update component',
      message: (error as Error).message 
    });
  }
});

/**
 * DELETE /components/:name - Delete component
 */
registryRouter.delete('/components/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const { version } = req.query;
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Delete component
    await storage.deleteComponent(name, version as string);
    
    // Remove from search index
    await searchEngine.removeComponent(name, version as string);
    
    res.json({
      success: true,
      message: 'Component deleted'
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to delete component',
      message: (error as Error).message 
    });
  }
});

/**
 * GET /components/:name/dependencies - Get component dependencies
 */
registryRouter.get('/components/:name/dependencies', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const { version } = req.query;
    
    const dependencies = await storage.getComponentDependencies(name, version as string);
    
    res.json(dependencies);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get dependencies',
      message: (error as Error).message 
    });
  }
});

/**
 * POST /components/check-updates - Check for component updates
 */
registryRouter.post('/components/check-updates', async (req: Request, res: Response) => {
  try {
    const { components } = req.body;
    
    if (!Array.isArray(components)) {
      return res.status(400).json({ error: 'Invalid request body' });
    }
    
    const updates = await Promise.all(
      components.map(async ({ name, version }) => {
        const latest = await storage.getComponent(name);
        return {
          name,
          currentVersion: version,
          latestVersion: latest?.metadata.version || version,
          hasUpdate: latest ? latest.metadata.version !== version : false
        };
      })
    );
    
    res.json(updates);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to check updates',
      message: (error as Error).message 
    });
  }
});

/**
 * GET /stats - Get registry statistics
 */
registryRouter.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await analytics.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get stats',
      message: (error as Error).message 
    });
  }
});