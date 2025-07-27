module.exports = {
    env: {
        node: true,
        browser: true,
        es2021: true,
        jest: true,
    },
    extends: [
        'eslint:recommended',
        'plugin:jest/recommended',
        'prettier'
    ],
    plugins: ['jest'],
    parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
    },
    rules: {
        // 代码质量规则
        'no-console': 'warn',
        'no-unused-vars': 'error',
        'prefer-const': 'error',
        'no-var': 'error',
        
        // 最佳实践
        'eqeqeq': 'error',
        'no-eval': 'error',
        'no-implied-eval': 'error',
        'no-new-func': 'error',
        
        // 代码风格
        'camelcase': 'warn',
        'consistent-return': 'error',
        'no-magic-numbers': ['warn', { ignore: [0, 1, -1] }],
        
        // Jest特定规则
        'jest/expect-expect': 'error',
        'jest/no-disabled-tests': 'warn',
        'jest/no-focused-tests': 'error',
        'jest/prefer-to-have-length': 'warn',
    },
    overrides: [
        {
            files: ['**/*.test.js'],
            rules: {
                'no-magic-numbers': 'off', // 测试文件中允许魔法数字
            }
        }
    ]
};
