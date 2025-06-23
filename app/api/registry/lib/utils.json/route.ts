import { NextResponse } from 'next/server';

export async function GET() {
  const utilsData = {
    "$schema": "https://ui.shadcn.com/schema/registry-item.json",
    "name": "utils",
    "type": "registry:lib",
    "dependencies": [
      "clsx",
      "tailwind-merge"
    ],
    "registryDependencies": [],
    "files": [
      {
        "path": "lib/utils.ts",
        "content": "import { type ClassValue, clsx } from \"clsx\";\nimport { twMerge } from \"tailwind-merge\";\n\nexport function cn(...inputs: ClassValue[]) {\n  return twMerge(clsx(inputs));\n}",
        "type": "registry:lib",
        "target": ""
      }
    ]
  };

  return NextResponse.json(utilsData, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}