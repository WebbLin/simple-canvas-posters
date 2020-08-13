## tt-simple-canvas-posters

Fork from [simple-canvas-posters](https://github.com/liuxian1990/simple-canvas-posters)

扩展了一部分能力，对字节平台也做了部分兼容

一款用 canvas 绘制朋友圈分享海报的简单工具，优点支持相对位置布局，无需计算绝对位置，会根据相对图层的位置改变布局。

目前仅支持字节小程序，可在 mpvue, nui-app 中使用。

## 安装

```
npm install tt-simple-canvas-posters --save
```

## 使用

```javascript
import SimpleCanvas from 'tt-simple-canvas-posters';

const canvas = new SimpleCanvas({
  scale: 1,
  canvasId: 'canvas'
}); // 实例化对象

canvas
  // 创建画板
  .createArtboard({
    id: 'share',
    backgroundColor: '#ffffff',
    width: 375,
    height: 600
  })

  // 创建avatar图片
  .drawCircleImage({
    id: 'avatar',
    path:
      'https://wx.qlogo.cn/mmopen/vi_32/DYAIOgq83eqML1IepKLibmc8XmO9pUKRh41ghjMZ8Kl3aQgmxwibC9PTRngUicicthczHGO6icyWgCYKPztcKa1NsOA/132',
    left: 10,
    top: 10,
    d: 60
  })
  // 创建文字
  .drawWrapText({
    id: 'nickname',
    fontSize: 16,
    text: `超级大魔王~`,
    // 位置参照
    referLayer: {
      id: 'avatar',
      left: 12,
      top: -(canvas.avatar.height / 2 + 8)
    }
  })

  .draw();
```

## API

### 构造函数

参数

```javascript
{
  scale: 1, // 缩放比例
  canvasId: 'canvas' // canvas组件的ID，必须与视图层相同
}
```

### 实例成员

#### instance.ctx CanvasContext 对象，当 API 不满足需求时，可以使用 ctx，直接调用小程序 Canvas API 进行绘制。

#### instance.layers 保存着所有图层

### 静态方法

#### SimpleCanvas.textHeight({text='', width=200, lineHeight=1, fontSize=12, scale=1})

获取文本高度

#### SimpleCanvas.textWidth({text='', fontSize=12, scale=1})

获取文本宽度

### 实例方法

#### instance.getAutoCanvasHeight():number

自动计算 canvas 的高度

#### instance.createArtboard({backgroundColor, width, height}):instance

指定颜色，大小，创建画板

#### instance.createRectangle({left, top, width, height, radius=0, path?, borderColor?, borderWidth?, backgroundColor?}):instance

创建矩形，可以填充图片颜色边框，可以指定圆角

#### instance.drawImage({left, top, path, width, height, mode?, sWidth?, sHeight?}):instance

绘制图片，mode 目前只支持'center'

#### instance.drawCircleImage(left, top, path, d):instance

绘制圆形图片

#### instance.drawWrapText({left, top, text='', fontSize=12, fontStyle?, width=200, lineHeight=1, color=''#333333'', fontFamily='Arial', maxLine?}):instance

绘制文字，可控制最大宽度自动换行，最大行数

#### instance.draw(callback):instance

绘图，绘制完成会执行 callback 回调

### 参数说明

| 参数            | 描述                                                 | 类型                           |
| --------------- | ---------------------------------------------------- | ------------------------------ |
| id              | 图层 ID                                              | string                         |
| scale           | 缩放比                                               | Number                         |
| height          | 高度                                                 | number                         |
| width           | 宽度                                                 | number                         |
| left            | x 轴坐标                                             | number                         |
| top             | y 轴坐标                                             | number                         |
| d               | 半径                                                 | number                         |
| path            | 图片路径                                             | string                         |
| fontSize        | 字体大小                                             | number                         |
| fontStyle       | 字体风格，字节只支持['italic', 'small-caps', 'bold'] | string                         |
| fontFamily      | 字体                                                 | string                         |
| text            | 文字内容                                             | string                         |
| lineHeight      | 行高比例                                             | number                         |
| maxLine         | 文字最大行数                                         | number                         |
| backgroundColor | 背景颜色                                             | [string, CanvasGradient color] |
| color           | 字体颜色                                             | string                         |
| borderWidth     | 边框宽度                                             | number                         |
| borderColor     | 边框颜色                                             | string                         |
| radius          | 边框弧度                                             | number                         |
| mode            | 绘制图像的模式，只支持'center'                       | string                         |
| sWidth          | 图片宽度                                             | number                         |
| sHeight         | 图片高度                                             | number                         |
| referLayer      | 相对某个图层定位{id, left, top}                      | object                         |

## 在原生小程序中使用

`npm run build` 之后将 dist/index.js copy 到原生小程序项目中
