# Changelog

> **Tags:**
> - :boom:   [Breaking Change]
> - :rocket: [New Feature]
> - :bug:    [Bug Fix]
> - :memo:   [Documentation]
> - :house:  [Internal]

## v1.0.0 (2019-07-18)

#### :house: Internal

- 测试通过，正式发布 1.0.0 版本。

## v0.1.1 (2019-07-17)

#### :rocket: New Feature

- 优化了问题 'reinstall node_modules' 的描述。

#### :bug: Bug Fix

- 在收集所有依赖包，以及分析哪些包需要更新时，忽略了 peer dependency 可能带来的报错。
- 使用 exec 获取 stdout & stderr 时，将 max buffer 增大至 10MB，避免数据溢出报错。

#### :memo: Documentation

- 更新了 README 中的示例 gif。

## v0.1.0 (2019-07-17)

#### :rocket: New Feature

- 第一个版本发布，在这里查看使用文档：[pkg-upgrade](https://www.npmjs.com/package/pkg-upgrade)。
