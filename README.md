# 比较与合并文档

[English](./README_en_US.md)

思源笔记插件，比较文档差异和合并文档。

该插件的初衷是为了解决外部导入的内容（如网页剪藏等）有更新，但在思源笔记内的相应笔记已进行了链接、样式修改等操作，需要将新导入的文档合并到原文档的情况。故目前合并建议为修改原文档，而不考虑新导入文档的更新问题。

> [!WARNING]
>
> 该项目还处在早期阶段，存在不稳定性，请谨慎使用。请特别注意目前问题部分。
>
> 生成的比较视图中，每个超级块最左侧块，对其的修改将同步到原文档对应块，请特别注意。

## 使用方法

1. 点击右上图标按钮(文档差异比较与合并)
2. 搜索选定原文档（文档 1）和想要与之比较的文档（文档 2），点击开始比较
3. 将生成原文档的副本，并在该副本中逐块显示差异
   - 超级块最左侧块为文档 1 中的块
   - 超级块中间块为差异展示，其中块形式、样式全部同文档 2，文字绿色表示添加，红色表示删除
   - 超级块中右侧块为合并建议，其中块形式、样式全部同文档 1，文字同文档 2
4. 确认对比情况
   - **每个超级块最左侧块会自动绑定文档 1 中的块，对其进行修改会同步修改文档 1 内容**
   - 对于新增的块，点击其所在超级块块标，可使用`将新增内容添加到原文档`功能将其添加到原文档中

## 比较方法

目前比较采用的方法较为低效，对每个块均要经过 3 次比较：

1. 块级更改：增加、删除、内部更改，这一步是为了将新块与原块进行一一对应，当其内部文字内容字符差异低于 50% 时，视为对应的块。
2. 行级更改：增加、删除、容器块更改、内部更改，这一步是为了将容器块（引用、列表等）内部的块进行一一对应，其中容器块更改表示如列表变为引用等。
3. 字符级更改：增加、删除，样式更改不会被检测，会保留原文档的行内样式。

## 目前问题

- 没有使用动态加载，比较超大文档可能会卡顿
- 比较视图使用的是Protyle（思源文档编辑器界面），但是里面的块均是虚拟的，即本地文件和数据库中不存在真实的比较文档，在其中进行编辑可能存在风险，虽然目前尚未发现较为严重的问题
