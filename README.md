
### 项目初始化和基本概念

依次输入项目名称: (monorepo-demo)

选择包管理器:（pnpm workspaces）

上述命令创建了一个基本的monorepo项目，包含了以下几个部分：

```bash
>>> Created a new Turborepo with the following:

apps
 - apps/docs
 - apps/web
packages
 - packages/eslint-config-custom
 - packages/tsconfig
 - packages/ui
```

`apps/*` 目录下是完整的应用的项目，可能会共享`packages/*`目录下的包
`packages/*` 目录下是一些共享的工具组件和配置包

每个 app 和 package 都是一个工作区 workspace，包含一个`package.json`文件。在 pnpm 项目根目录下，会有一个`pnpm-workspace.yaml`文件。该文件定义工作区的根目录，并允许在工作区中包含/排除目录。

```yaml
  packages:
    - "apps/*"
    - "packages/*"
```

这是由 pnpm 提供的monorepo功能，这样，就能在每个工作区中相互引用依赖。比如，在 `apps/web` 中 引用`packages/ui`作为依赖项，只需在`web`下的 `package.json`文件中指定，添加包名：

```json
{
  // ...
  "dependencies": {
    "ui": "workspace:*" 
  }
}
// * 允许我们引用最新版本的依赖项。如果包的版本发生变化，它使我们无需更改依赖项的版本。
```

##### pnpm包管理相关命令

第一次clone项目安装依赖直接执行`pnpm install`，会看到项目根目录和每个workspace中都会出现`node_modules`目录。

如果一个workspace单独安装/移除/升级包，执行下面的命令：

```bash
# 安装：
pnpm add <package> --filter <workspace>

# 移除：
pnpm uninstall <package> --filter <workspace>

# 升级
pnpm update <package> --filter <workspace>
```


##### turbo.json

最后看下turborepo的配置文件`turbo.json`。

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**"]
    },
    "lint": {},
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}

```

上面配置中重点关注管道`pipeline`和`dependsOn`。

其中`pipeline` 表示项目的任务依赖关系，`turbo` 根据其中的配置安排、执行和缓存项目中任务的输出。
`pipeline`对象中的每个键都是一个可以被`turbo run`执行的任务名称。如果 `turbo` 在所有workspace中的`package.json`中找到具有相同键名的`script`，这个npm脚本就会在管道任务执行时运行。

`dependsOn` 表示该任务所依赖的任务列表。在其中某一项前添加`^`前缀是告诉turbo该管道任务的执行需要它的工作空间内的依赖先执行完成`^`前缀标识的任务。比如：上面配置中`build`任务只会在它的`dependencies`和`devDependencies`中依赖完成自己的`build`命令后执行一次。

### 项目改造

假设一个场景：我们需要创建一个公共的React组件库，在组件库内部存在：1. ui 核心组件库，2. helper 辅助函数库，3. hooks 公共hooks库；同时还需要有个example的示例项目和 docs 的文档项目。接下来将基于之前的基础结构进行改造和配置。

首先，turborepo并没有固定的目录结构，可以按照自己的习惯搭建，比如我们想将eslint 和 typescript 配置从packages中拿出来放到一个专门的配置目录 `configs`下面, 只需移动文件完成后在`pnpm-workspace.yaml`中新增配置：

```yaml
packages:
  - "apps/*"
  - "packages/*"
  - "configs/*" # 新增
```

#### packages

清空packages里的所有子项目，开始创建新的package项目：

```bash
cd packages
mkdir helper & cd helper
pnpm init
```

在`package.json`中，修改 name，为当前的包指定一个scope，该操作可选，防止在发布时包名已被占。

```json
{
  "name": "@42arch/helper",
}
```

在根目录下安装tsup打包工具：

```bash
pnpm add tsup --filter @42arch/helper
```

进入helper目录下新建`tsup.config.ts`配置文件：

```ts
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  splitting: false,
  sourcemap: true,
  clean: true,
  format: ['esm', 'cjs'],
  dts: true
})

```

在package.json中添加脚本命令：

```json
{
  "scripts": {
    "build": "tsup",
    "dev": "pnpm run build --watch"
  }
}
```

引入tsconfig配置，在package.json中添加：

```json
{
  "devDependencies": {
    "tsconfig": "workspace:*"
  }
}
```

新建`tsconfig.json`文件：

```json
{
  "extends": "tsconfig/base.json",
  "include": ["."],
  "exclude": ["dist", "node_modules"],
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"]
  }
}
```

编写代码

新建`src/index.ts`文件：
```ts
export const add = (a: number, b: number) => {
  return a + b;
}

export const multiply = (a: number, b: number) => {
  return a * b;
}
```

接下来，用类似的步骤处理 `ui` 组件库，不同的是，组件库需要安装react等依赖和jsx打包配置。

```json
// package.json
{
  "name": "@42arch/ui",
  "version": "0.0.1",
  "description": "",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "files": [
    "dist/**"
  ],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch"
  },
  "dependencies": {
    "react": "^18.2.0",
    "styled-components": "^6.1.0"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "devDependencies": {
    "@types/react": "^18.2.30",
    "@types/react-dom": "^18.2.14",
    "tsconfig": "workspace:*",
    "tsup": "^7.2.0"
  }
}
```

tsup.config.ts 配置

```ts
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.tsx'],
  splitting: false,
  sourcemap: true,
  clean: true,
  format: ['esm', 'cjs'],
  dts: true,
  external: ['react']
})

```

#### app

删除apps中以后的项目，使用vite新建一个名为example新的react项目：

```bash
pnpm create vite@latest
```
依次命名项目名`example`, 选择`react + typescript`模版，这样创建了一个react项目。


在example的`package.json`文件中添加 packages 目录下的包作为依赖：

```json
{
  "dependencies": {
    // ...
    "@42arch/helper": "workspace:*",
    "@42arch/ui": "workspace:*"
  },
}
```

修改`src/App.tsx`:

```tsx
import { Button } from '@42arch/ui'
import { add } from '@42arch/helper'
import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(1)
  const onAdd = (count: number) => {
    return add(count, 4)
  }

  return (
    <>
      <h1>Count: {count}</h1>
      <div className="card">
        <Button onClick={() => {
          const currentCount = onAdd(count)
          setCount(currentCount)
        }}>Increment</Button>
      </div>
    </>
  )
}

export default App
```

开发模式：

在根目录下运行：

```bash
pnpm dev
```

在命令行中可以看到 `turbo` 启动了所有workspace的 dev 脚本，打开example项目的默认链接`http://127.0.0.1:5173/`, 可以看到组件和辅助函数都正常执行了。在开发模式下修改packages下的相关代码，example的页面也会自动热更新。

