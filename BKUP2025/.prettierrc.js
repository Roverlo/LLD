module.exports = {
    // 基本格式化选项
    semi: true,                    // 语句末尾添加分号
    trailingComma: 'es5',         // 尾随逗号（ES5兼容）
    singleQuote: true,            // 使用单引号
    printWidth: 120,              // 行宽限制
    tabWidth: 4,                  // 缩进宽度
    useTabs: false,               // 使用空格而不是制表符
    
    // 对象和数组格式化
    bracketSpacing: true,         // 对象字面量的大括号间添加空格
    bracketSameLine: false,       // 多行JSX元素的>放在下一行
    
    // 箭头函数参数
    arrowParens: 'always',        // 箭头函数参数总是使用括号
    
    // 换行符
    endOfLine: 'lf',              // 使用LF换行符
    
    // HTML/CSS特定
    htmlWhitespaceSensitivity: 'css',
    
    // 文件覆盖配置
    overrides: [
        {
            files: '*.json',
            options: {
                tabWidth: 2,      // JSON文件使用2空格缩进
            }
        },
        {
            files: '*.md',
            options: {
                printWidth: 80,   // Markdown文件行宽限制
                proseWrap: 'always',
            }
        }
    ]
};
