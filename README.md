# 比较与合并文档

[English](./README_en_US.md)

思源笔记插件，比较文档差异和合并文档。

## 使用方法

1. 点击右上图标按钮(文档差异比较与合并)
2. 搜索选定原文档（文档 1）和想要与之比较的文档（文档 2），点击开始比较
3. 将生成原文档的副本，并在该副本中逐块显示差异
   - 超级块最左侧块为文档 1 中的块
   - 超级块中间块为差异展示，其中块形式、样式全部同文档 2，文字绿色表示添加，红色表示删除
   - 超级块中右侧块为合并建议，其中块形式、文字同文档 2，并合并文档 1 和文档 2 样式
4. 确认对比情况，可以在该文档中进行修改
5. 点击超级块块标，可以选择使用左侧、中间或右侧块进行更新

## 目前问题

- 无法插入新增的块 [issue1](https://github.com/etchnight/siyuan-plugin-diff/issues/1)
- 生成的超级块可能有问题，思源笔记可能会刷新界面以修复[issue2](https://github.com/etchnight/siyuan-plugin-diff/issues/2)
- 选择想要比较的文档时菜单会自动关闭，需要再重新点击图标按钮[issue3](https://github.com/etchnight/siyuan-plugin-diff/issues/3)
