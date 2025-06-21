import { NextResponse } from 'next/server';
import registry from '@/registry/index.json';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  request: Request,
  { params }: { params: { name: string } }
) {
  const component = registry.find(c => c.name === params.name);
  
  if (!component) {
    return NextResponse.json(
      { error: 'Component not found' },
      { status: 404 }
    );
  }

  // Read the actual component files
  const filesWithContent = await Promise.all(
    component.files.map(async (file) => {
      const filePath = path.join(process.cwd(), file.path);
      const content = await fs.readFile(filePath, 'utf-8');
      return {
        ...file,
        content
      };
    })
  );

  return NextResponse.json({
    ...component,
    files: filesWithContent
  });
}