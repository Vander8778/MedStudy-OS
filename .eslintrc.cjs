module.exports = {
  root: true,
  ignorePatterns: [
    "node_modules/",
    "dist/",
    "build/",
    ".next/",
    ".turbo/",
    ".expo/",
    ".expo-shared/",
    "coverage/",
    "target/",
    "apps/desktop/src-tauri/target/"
  ],
  env: {
    es2022: true
  },
  settings: {
    "import/resolver": {
      typescript: true
    }
  },
  overrides: [
    {
      files: ["**/*.js", "**/*.cjs", "**/*.mjs"],
      env: {
        node: true
      },
      extends: ["eslint:recommended", "prettier"]
    },
    {
      files: ["**/*.ts", "**/*.tsx"],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true
        }
      },
      plugins: ["@typescript-eslint", "import"],
      extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:import/recommended",
        "prettier"
      ],
      rules: {
        "@typescript-eslint/consistent-type-imports": "error",
        "import/no-extraneous-dependencies": "error"
      }
    },
    {
      files: [
        "apps/mobile/**/*.{ts,tsx}",
        "apps/desktop/**/*.{ts,tsx}",
        "apps/web-admin/**/*.{ts,tsx}",
        "packages/ui-kit/**/*.{ts,tsx}"
      ],
      plugins: ["react", "react-hooks"],
      extends: [
        "plugin:react/recommended",
        "plugin:react-hooks/recommended",
        "prettier"
      ],
      settings: {
        react: {
          version: "detect"
        }
      },
      rules: {
        "react/react-in-jsx-scope": "off"
      }
    },
    {
      files: ["apps/web-admin/**/*.{ts,tsx}"],
      plugins: ["@next/next"],
      extends: ["plugin:@next/next/recommended", "prettier"]
    },
    {
      files: ["packages/contracts/**/*.{ts,tsx}"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            "patterns": [
              "@medstudy/domain",
              "@medstudy/domain/*",
              "@medstudy/ai-schemas",
              "@medstudy/ai-schemas/*",
              "@medstudy/ui-kit",
              "@medstudy/ui-kit/*"
            ]
          }
        ]
      }
    },
    {
      files: ["packages/domain/**/*.{ts,tsx}"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            "patterns": [
              "@medstudy/domain/*",
              "@medstudy/ai-schemas",
              "@medstudy/ai-schemas/*",
              "@medstudy/ui-kit",
              "@medstudy/ui-kit/*"
            ]
          }
        ]
      }
    },
    {
      files: ["packages/ai-schemas/**/*.{ts,tsx}"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            "patterns": [
              "@medstudy/domain",
              "@medstudy/domain/*",
              "@medstudy/ui-kit",
              "@medstudy/ui-kit/*"
            ]
          }
        ]
      }
    },
    {
      files: ["packages/ui-kit/**/*.{ts,tsx}"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            "patterns": [
              "@medstudy/contracts",
              "@medstudy/contracts/*",
              "@medstudy/domain",
              "@medstudy/domain/*",
              "@medstudy/ai-schemas",
              "@medstudy/ai-schemas/*"
            ]
          }
        ]
      }
    },
    {
      files: [
        "apps/mobile/**/*.{ts,tsx}",
        "apps/desktop/**/*.{ts,tsx}",
        "apps/web-admin/**/*.{ts,tsx}"
      ],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            "patterns": [
              "@medstudy/domain",
              "@medstudy/domain/*",
              "@medstudy/ai-schemas",
              "@medstudy/ai-schemas/*"
            ]
          }
        ]
      }
    },
    {
      files: ["apps/backend/**/*.{ts,tsx}"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            "patterns": ["@medstudy/ui-kit", "@medstudy/ui-kit/*"]
          }
        ]
      }
    }
  ]
};
