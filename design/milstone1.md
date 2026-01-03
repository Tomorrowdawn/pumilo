## SDK

### 核心

第一阶段，完成 TEXT 组件。允许开发者使用

```ts
import { TEXT } from "@pumilo/sdk";
```

```ts
<p>Hello <TEXT id="content" ...></p>
```

来创建react应用。开发者的仓库被称为Target Repo. **不应该和Pumilo代码混在一起**

### 内置模板

允许用户从 `@pumilo/sdk/templates`中导出内置模板。
作为MVP, 提供一个HelloTemplate. 它仅仅是一个 Hello + <TEXT>组件。

## Pumilo仓库约定

只要Target Repo中包含一个pumilo-templates文件夹，该文件夹中包含一系列文件夹，每个文件夹都是template.ts + schema.json，并且符合以下规范，这就是一个Pumilo仓库。

1. template.js默认导出一个模板。
2. schema.json描述模板所有所需的数据（参数）的规格。

### 模板

一个模板是一个React组件。

### 数据

数据可以填充到模板中渲染成最终HTML。类似于参数。

### 页面

Pumilo中一切都是一个页面。页面具有以下属性：

1. 模板。
2. 数据。
3. 路由。

## 编辑器后端

编辑器后端负责两件事情：

1. 配合前端进行渲染和编辑
2. 编译成html/js/css, 将增量更新推送到Target-Repo的发布分支（通常是github-pages）上去。

### 与前端配合

#### Create Editable Instance

后端具有一个方法 `create_editable_instance`，收到Target Repo的路径（注意这个路径是URL，可以是本地（通常是测试），也可以是远程），template的名字。它将去

`Target/pumilo-templates/<name>` 下寻找template.ts。它将做进行初步编译：

1. 设定当前为“编辑模式”，编译template.ts（注意该文件可能引用Target里面的其他ts组件）。TEXT等pumilo提供的组件将会自动转换成某种输入框（TEXT会变成input）。这些输入框在编辑之后可以自动地向后端更新值。

#### Create Data

`create_data(path, schema_path)`接受一个path和可选的schema_path（如果path存在，可置空，否则强制）. 如果该path存在于数据库中，则返回它的json数据；否则，按照schema_path读取schema.json,并生成一个默认值填充的data.json。将其储存到磁盘上。

#### Weave

`weave(editable_instance, data)` 将data填充到editable_instance中，返回一个editable_instance。它等于一个HTML。这就是前端最终接受到的HTML. 

后端还需要让前端可以访问其他css/js等资源（因为模板中可能引用），基本等价于dist/，此处不赘述，遵守最佳实践即可。

#### Update

后端公开一个接收更新的接口。每个pumilo转换的更新组件都会定时发送id:value回来，代表用户的最新更新。后端将会更新储存的数据。

#### Read

后端公开一个当前有哪些页面的api。

#### 工作流程

##### 新建

前端指定Target repo, template，然后点击新建按钮，配置路由（通常有一些自动逻辑，例如博客页面下创建的页面就自动路由到blog/post-name，但是后端不管这些细节）， 将这些信息发回后端。后端发现没有相关数据，就自动生产一个空数据包，然后完成CEI->CD->Weave流程，将编辑器页面返回前端。前端用户进行编辑，编辑组件将新值发回后端更新数据。

##### 续写/编辑

这种情况下，前端已经提前知道了path（通过read api）。其余不变。

### 发布编译

在这一阶段，后端的目标是：

- 产出dist文件夹。
- 更新到Target的github-pages分支上。

#### Compile

后端在此时持有一个页面。它将模板转换成纯html并填充数据。使用esbuild 的rollup 模式（不打包）得到dist。

#### 更新Target

pumilo只是简单地将dist内容提交到github pages分支上。此时git会自动处理好依赖更新/忽略重复等。

## Milestone 1的pumilo编辑器流程

在第一阶段，验收标准如下：

1. 准备一个pumilo仓库作为target。
2. 启动pumilo后端。
3. 启动pumilo前端。
4. 在前端中指定仓库路径，template
5. 编辑一个页面。
6. 发布
7. 检查target的github-pages分支是否符合预期。