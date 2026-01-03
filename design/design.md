pumilo的主要功能是创建静态站点并提供强大的编辑能力。

## 术语

Pumilo的世界中，包含以下关键术语：

- 模板仓库。这是一个git仓库的某个分支（通常是Main）。这个仓库里包含有一个pumilo-templates文件夹。里面包含数个tsx文件。每个文件的默认导出被视作一个模板。习惯上，它们被命名为XXTemplate. 用户编辑时，路径关系为模板仓库文件夹结构。这意味着可以通过..去其他文件夹下使用可复用的组件。整体上和react编程无异。
- Pumilo SDK. 这是一个给模板使用的react sdk. 用户可以从中导出组件，例如 import TEXT from "@pumilo/sdk". pumilo的所有组件都强制要求一个id标识。
- Pumilo Context. pumilo区分“编辑时”和“发布时”。当编辑时，sdk返回相应的编辑器。例如RICHTEXT元素会被换成一个富文本编辑器。当发布时，sdk通过pumilo context根据id查找内容，返回html本身。
- Pumilo程序。pumilo本身是一个使用docker发布的程序。它包含：
- Pumilo后端。Pumilo后端负责保存数据，从模板仓库拉取代码，编译模板仓库代码发送到编辑器前端，根据数据填充模板，生成部署。
  也是在后端这里，模板代码会被编译成html/js/css发送到前端。
- Pumilo前端。Pumilo前端从后端得到的已经是标准的html/js/css, 正常渲染。

## 流程

当用户编辑一个页面时，他需要经历以下几步：

1. 编辑模板。这相当于写react代码。然后去pumilo-templates下公开一个入口。
2. 使用pumilo编辑器，指定仓库，指定模板，然后在前端编写内容。在pumilo前端编写之后，会提交到后端保存，其内容类似于[{"id":xx, "value":yyy}]. 
3. 当选择发布时，后端会将数据内容插入到Pumilo Context中进行构建。具体来说，会产出一个临时的dist文件夹，然后与github-pages（分布分支）进行diff, 将有改动或者新增的部分提交过去。这类似于“增量更新”。因为pumilo不会每次都针对所有文章进行构建（实际上也不会保存所有文章的原始数据，比如换一个电脑就丢了。只有最后的html存在github-pages里）

## 文件夹结构

src/
   sdk/ #pumilo给react提供的sdk
   backend/ ##pumilo backend
   webui/ ##pumilo的编辑器前端

## SDK

pumilo目前提供两个关键字。它们在发布时应该都是HTML. 所以主要介绍编辑时的区别：

- TEXT. 这个元素表示一个普通的input文本框。适用于不希望引入沉重编辑器的地方（例如导航栏的编辑）。
- RICHTEXT. 这是一个基于tiptap的富文本编辑器。这个编辑器提供类似于飞书的编辑能力。特别地，它应当满足以下最小的要求：
  1. Markdown支持
  2. Latex支持（`$$和 $$$$`）
  3. 粘贴图片（通过github图床）
  4. 文字高亮
  5. 表格支持。这个表格应该支持：1）单元格内编写富文本。2）固定表头 3）单元格/行列 染色 4）单元格可自由调节宽高。

