# Pumilo 核心机制与实现原理

## 需求背景

如果你想要编写一个可编辑的网页模板，让非技术人员可以多次复用生成不同的页面，但你又不想让他们直接去编辑 HTML（那太容易出错了，而且不直观），你应该怎么办？

更进一步，有时候你甚至希望在编辑时提供更好的交互体验（比如所见即所得的富文本编辑器，或者特定的日期选择器），而在发布时生成的只是纯粹、高性能的静态 HTML。

Pumilo 正是为了解决这个问题而生。它允许开发者使用熟悉的 **React** 来编写模板，通过 Pumilo 的 **SDK** 提供的组件定义可编辑区域。Pumilo 负责在“编辑模式”下渲染编辑器，在“发布模式”下生成静态代码。

没有魔法，只有清晰的架构设计。

---

## 开发者视角：如何编写模板

在 Pumilo 中，开发者的工作环境被称为 **Target Repo**。这是一个标准的 Git 仓库，所有的模板都存放在 `pumilo-templates` 目录下。

### 1. 编写 React 组件

你只需要编写一个普通的 React 组件，并使用 `@pumilo/sdk` 提供的 `<TEXT>` 组件来标记哪里是可以被用户修改的。

```typescript
// pumilo-templates/hello-world/template.tsx
import type { FC } from "react";
import { TEXT } from "@pumilo/sdk";

export const HelloTemplate: FC = () => (
  <div className="card">
    <h1>
      {/* 
        id: 数据存储的键名
        placeholder: 当数据为空时的提示
      */}
      Hello <TEXT id="username" placeholder="World" />
    </h1>
    <p>
      <TEXT id="description" placeholder="Write something here..." />
    </p>
  </div>
);

export default HelloTemplate;
```

### 2. 定义数据 Schema

为了让 Pumilo 知道如何初始化数据，你需要在同级目录下提供一个 `schema.json`。

```json
// pumilo-templates/hello-world/schema.json
{
  "username": "Guest",
  "description": "Welcome to my website."
}
```

这就是开发者需要做的全部工作。

---

## Under the Hood: Pumilo 是如何工作的

Pumilo 的核心在于它如何处理同一个组件在不同场景下的表现。我们将这个过程分为三个关键部分：**SDK 运行时**、**后端编译** 和 **发布流水线**。

### 1. SDK 里的“双面人”

`@pumilo/sdk` 中的核心组件（如 `<TEXT>`）本质上是一个根据 `Context` 切换渲染逻辑的组件。

在 **`src/sdk/components/PumiEdit.tsx`** 中，逻辑非常直观：

```typescript
export const PumiEdit = ({ id, children }) => {
  // 从 Context 中获取当前模式
  const { mode, data } = usePumiloContext();
  
  // 场景 A：编辑模式 (Editor)
  if (mode === "edit") {
    return (
      <>
        {/* 渲染原始组件，通常作为 Input 的默认值或占位 */}
        {children}
        {/* 
           关键点：注入一段 Script，告诉父级编辑器页面这里有一个可编辑字段。
           Pumilo 的 WebUI 会监听这些注册信息来生成右侧的属性面板（如果需要）
           或者直接原地通过 contentEditable 进行编辑。
           (当前实现中，TEXT 会渲染为 Input 框供用户输入)
        */}
        <script dangerouslySetInnerHTML={{ ...registerFieldMetadata(id) ... }} />
      </>
    );
  }
  
  // 场景 B：发布模式 (Publish)
  // 直接从 data 中读取值，渲染成纯文本或简单的 span
  const value = data[id] || defaultContent;
  return <span>{value}</span>;
};
```

### 2. 后端引擎：动态编译与 Weaving

Pumilo 的后端（运行在 Bun 上）不依赖任何复杂的黑盒构建工具，它充分利用了 Web 标准和现代工具链。

#### 动态编译 (Just-in-Time Compilation)
当用户请求编辑某个模板时，后端会使用 `Bun.build` 对 Target Repo 中的 `template.tsx` 进行实时打包。
- **Externalization**: 它将 `react` 和 `@pumilo/sdk` 标记为 external，确保模板使用编辑器环境提供的 React 实例，避免版本冲突。
- **Scope**: 编译产物是一个独立的 ES Module。

#### 编织 (Weaving)
这是 Pumilo 将“数据”和“模板”结合的过程。
1. **加载数据**: 从 JSON 文件读取页面的数据（例如 `username: "Alice"`）。
2. **加载组件**: 动态 import 编译好的模板 JS 文件。
3. **渲染**: 使用 `React.createElement` 将组件包裹在 `PumiloProvider` 中。
   - 如果是**编辑**请求：Provider 的 `mode` 设为 `edit`。
   - 如果是**发布**请求：Provider 的 `mode` 设为 `publish`。
4. **输出**: 使用 `renderToStaticMarkup` 生成 HTML 字符串。

### 3. 编辑器交互

WebUI 编辑器实际上是一个宿主环境。它通过 `iframe` 加载后端“编织”好的编辑模式 HTML。
- **数据流**：用户在 `iframe` 内的 `<input>`（由 `<TEXT>` 渲染而来）中输入内容 -> 组件捕获 `onChange` -> 发送消息给 WebUI -> WebUI 调用后端 API 保存数据。
- **所见即所得**：因为使用的是真实的 React 组件渲染，用户看到的样式与最终发布的完全一致。

### 4. 发布：基于 Git 的自动化

Pumilo 坚持“不持有用户代码”的原则。发布过程本质上是一系列 Git 操作：

1. **生成**: 后端以 `mode="publish"` 调用 Weaving 流程，生成纯静态的 HTML 文件。
2. **切换分支**: 后端通过 `git` 命令在 Target Repo 中切换到 `gh-pages` 分支（这是一个孤儿分支）。
3. **写入与提交**:
   - 如果是首次创建 `gh-pages` 分支，会清空工作区以确保干净。
   - 如果分支已存在，则进行**增量更新**：仅覆盖当前页面的 HTML 文件，保留其他已发布的文件。
   - 最后执行 `git add` 和 `git commit`。
4. **恢复**: 切回原来的开发分支，保持工作区整洁。

通过这种方式，Pumilo 利用 GitHub Pages（或其他静态托管服务）自动完成了部署，无需额外部署服务器。
