import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
// Mark JSX component bindings as used without adding another lint dependency.
const jsxBindings = {
  rules: {
    'uses-vars': {
      create(context) {
        return {
          JSXOpeningElement(node) {
            let name = node.name;
            while (name.type === 'JSXMemberExpression') name = name.object;
            if (name.type === 'JSXIdentifier' && /^[A-Z]/.test(name.name)) {
              context.sourceCode.markVariableAsUsed(name.name, node);
            }
          },
        };
      },
    },
  },
};
export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.expo/**',
      '**/coverage/**',
      '**/.tmp/**',
      '**/.npm-cache/**',
    ],
  },
  {
    files: ['**/*.{js,jsx,mjs}'],
    ...js.configs.recommended,
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { 'react-hooks': reactHooks, 'jsx-bindings': jsxBindings },
    rules: {
      'jsx-bindings/uses-vars': 'error',
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },
  prettier,
];
