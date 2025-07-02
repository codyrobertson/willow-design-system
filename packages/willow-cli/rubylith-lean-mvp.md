# Rubylith Component Registry - Lean MVP

## Vision
A simple component registry with basic contracts to ensure components work where they're installed.

## Core Features Only

### 1. Component Storage & Retrieval
- Upload components as tarballs
- Download components by name/version
- Basic metadata (name, version, description, author)

### 2. Simple Contracts
Components declare:
- **Interface**: Props schema (JSON Schema)
- **Framework**: react@18, vue@3, etc. 
- **Dependencies**: Required peer dependencies
- **Style Engine**: tailwind, css-modules, styled-components

### 3. Basic Validation
- Validate component matches its contract
- Check framework compatibility
- Verify required dependencies exist

### 4. Registry API
- `POST /components` - Upload component
- `GET /components` - List/search components  
- `GET /components/:name` - Get component details
- `GET /components/:name/:version` - Download component
- `POST /components/:name/validate` - Validate component

### 5. CLI Tool
- `rubylith publish ./dist` - Publish component
- `rubylith install button` - Install component
- `rubylith search input` - Search components
- `rubylith validate` - Validate local component

## What We're NOT Building (Yet)
- Complex environment negotiation
- Mount plans and orchestration  
- Performance monitoring
- Multi-tenancy
- Advanced analytics
- Capability providers
- Theme systems
- Migration tools

## Success Criteria
- Can publish a React button component
- Can install it in another React project  
- Contract validation catches basic incompatibilities
- CLI is simple and fast

## Tech Stack
- **Backend**: Node.js + Express + SQLite
- **Storage**: Local filesystem (S3 later)
- **Validation**: JSON Schema + Zod
- **CLI**: Node.js CLI tool
- **Database**: Simple tables (Component, Contract, Version)

## Database Schema
```sql
-- Components
CREATE TABLE components (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  author TEXT,
  license TEXT,
  created_at DATETIME,
  updated_at DATETIME
);

-- Versions  
CREATE TABLE versions (
  id TEXT PRIMARY KEY,
  component_id TEXT REFERENCES components(id),
  version TEXT NOT NULL,
  contract TEXT NOT NULL, -- JSON contract
  tarball_path TEXT NOT NULL,
  download_count INTEGER DEFAULT 0,
  created_at DATETIME,
  UNIQUE(component_id, version)
);
```

## Contract Format (Minimal)
```json
{
  "name": "button",
  "version": "1.0.0",
  "framework": {
    "name": "react",
    "version": "^18.0.0"
  },
  "styleEngine": "tailwind",
  "interface": {
    "props": {
      "type": "object",
      "properties": {
        "variant": {"type": "string", "enum": ["primary", "secondary"]},
        "size": {"type": "string", "enum": ["sm", "md", "lg"]},
        "children": {"type": "string"}
      },
      "required": ["children"]
    }
  },
  "dependencies": {
    "class-variance-authority": "^0.7.0"
  }
}
```

## MVP Workflow
1. Developer creates button component
2. Writes simple contract.json
3. Runs `rubylith publish` - validates & uploads
4. Other dev runs `rubylith install button`
5. CLI checks compatibility, downloads if valid
6. Component works or clear error why not

This is actually useful and achievable in 4-6 weeks.