import { NextResponse } from 'next/server';

export async function GET() {
  const registryData = {
    "name": "willow-design-system",
    "type": "registry:ui",
    "dependencies": [
      "clsx",
      "tailwind-merge",
      "lucide-react",
      "class-variance-authority"
    ],
    "registryDependencies": [],
    "files": [
      {
        "name": "utils",
        "type": "registry:lib",
        "files": ["lib/utils.ts"]
      }
    ],
    "tailwind": {
      "config": {
        "theme": {
          "extend": {
            "colors": {
              "border": "hsl(var(--border))",
              "input": "hsl(var(--input))",
              "ring": "hsl(var(--ring))",
              "background": "hsl(var(--background))",
              "foreground": "hsl(var(--foreground))",
              "primary": {
                "DEFAULT": "hsl(var(--primary))",
                "foreground": "hsl(var(--primary-foreground))"
              },
              "secondary": {
                "DEFAULT": "hsl(var(--secondary))",
                "foreground": "hsl(var(--secondary-foreground))"
              },
              "destructive": {
                "DEFAULT": "hsl(var(--destructive))",
                "foreground": "hsl(var(--destructive-foreground))"
              },
              "muted": {
                "DEFAULT": "hsl(var(--muted))",
                "foreground": "hsl(var(--muted-foreground))"
              },
              "accent": {
                "DEFAULT": "hsl(var(--accent))",
                "foreground": "hsl(var(--accent-foreground))"
              },
              "popover": {
                "DEFAULT": "hsl(var(--popover))",
                "foreground": "hsl(var(--popover-foreground))"
              },
              "card": {
                "DEFAULT": "hsl(var(--card))",
                "foreground": "hsl(var(--card-foreground))"
              }
            },
            "borderRadius": {
              "lg": "var(--radius)",
              "md": "calc(var(--radius) - 2px)",
              "sm": "calc(var(--radius) - 4px)"
            }
          }
        }
      }
    },
    "cssVars": {
      "light": {
        "--background": "0 0% 100%",
        "--foreground": "222.2 84% 4.9%",
        "--card": "0 0% 100%",
        "--card-foreground": "222.2 84% 4.9%",
        "--popover": "0 0% 100%",
        "--popover-foreground": "222.2 84% 4.9%",
        "--primary": "221.2 83.2% 53.3%",
        "--primary-foreground": "210 40% 98%",
        "--secondary": "210 40% 96%",
        "--secondary-foreground": "222.2 84% 4.9%",
        "--muted": "210 40% 96%",
        "--muted-foreground": "215.4 16.3% 46.9%",
        "--accent": "210 40% 96%",
        "--accent-foreground": "222.2 84% 4.9%",
        "--destructive": "0 84.2% 60.2%",
        "--destructive-foreground": "210 40% 98%",
        "--border": "214.3 31.8% 91.4%",
        "--input": "214.3 31.8% 91.4%",
        "--ring": "221.2 83.2% 53.3%",
        "--radius": "0.5rem"
      },
      "dark": {
        "--background": "222.2 84% 4.9%",
        "--foreground": "210 40% 98%",
        "--card": "222.2 84% 4.9%",
        "--card-foreground": "210 40% 98%",
        "--popover": "222.2 84% 4.9%",
        "--popover-foreground": "210 40% 98%",
        "--primary": "217.2 91.2% 59.8%",
        "--primary-foreground": "222.2 84% 4.9%",
        "--secondary": "217.2 32.6% 17.5%",
        "--secondary-foreground": "210 40% 98%",
        "--muted": "217.2 32.6% 17.5%",
        "--muted-foreground": "215 20.2% 65.1%",
        "--accent": "217.2 32.6% 17.5%",
        "--accent-foreground": "210 40% 98%",
        "--destructive": "0 62.8% 30.6%",
        "--destructive-foreground": "210 40% 98%",
        "--border": "217.2 32.6% 17.5%",
        "--input": "217.2 32.6% 17.5%",
        "--ring": "224.3 76.3% 94.1%",
        "--radius": "0.5rem"
      }
    }
  };

  return NextResponse.json(registryData, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}