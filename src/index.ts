interface Layer {
  id: string;
  type?: string;
  height?: number;
  width?: number;
  left?: number;
  top?: number;
  d?: number;
  path?: string;
  fontSize?: number;
  fontStyle?: string;
  fontFamily?: string;
  text?: string;
  lineHeight?: number;
  maxLine?: number;
  backgroundColor?: string;
  color?: string;
  borderWidth?: number;
  borderColor?: string;
  radius?: number;
  referLayer?: Layer;
  mode?: string;
  sWidth: number;
  sHeight: number;
}

function addLayer(layer: Layer): void {
  if (layer.id) {
    toScale(layer, 1 / this.scale);
    this.layers.push(layer);
    if (this[layer.id] === undefined) {
      this[layer.id] = layer;
    } else {
      console.warn('建议id格式为#xxx,以免跟现有属性重复', layer);
    }
  } else {
    console.warn('建议给图该图层加上id', layer);
  }
}

function toScale(layer: Layer, scale: number) {
  if (layer) {
    Object.keys(layer).forEach((key) => {
      if (Object.prototype.toString.call(layer[key]) === '[object Number]') {
        layer[key] = layer[key] * scale;
      }
    });
  }
}

function relativePosition(layer: Layer): Layer {
  if (layer.referLayer) {
    const referLayer: Layer = this[layer.referLayer.id];
    if (referLayer) {
      const { top, left } = layer.referLayer;
      top === undefined ||
        (layer.top = referLayer.top + referLayer.height + top);
      left === undefined ||
        (layer.left = referLayer.left + referLayer.width + left);
    } else {
      console.warn(`没有定义[ ${layer.referLayer.id} ]这个id`, layer);
    }
  }
  toScale(layer, this.scale);
  delete layer.referLayer;
  return layer;
}

function getStrLength(str = ''): number {
  let len = 0;
  for (let i = 0; i < str.length; i += 1) {
    const c = str.charCodeAt(i);
    // 单字节加1
    if ((c >= 0x0001 && c <= 0x007e) || (c >= 0xff60 && c <= 0xff9f)) {
      len += 1;
    } else {
      len += 2;
    }
  }
  return Math.ceil(len / 2);
}

class SimpleCanvas {
  scale: number = 1;
  ctx: any;
  canvasId: string;
  layers: Layer[] = [];

  constructor({ scale = 1, canvasId }: any) {
    const ctx = tt.createCanvasContext(canvasId);
    this.scale = scale;
    this.ctx = ctx;
    this.canvasId = canvasId;
  }

  static textHeight = ({
    text = '',
    width = 200,
    lineHeight = 1,
    fontSize = 12,
    scale = 1
  }: any): number => {
    const textLength = getStrLength(text);
    const textWidth = textLength * fontSize;
    const textRowNum = Math.ceil(textWidth / width);
    return textRowNum * (lineHeight + fontSize) * scale - lineHeight;
  };
  static textWidth({ text = '', fontSize = 12, scale = 1 }) {
    return getStrLength(text) * fontSize * scale;
  }
  // 获取canvas高度
  getAutoCanvasHeight(): number {
    return Math.max.apply(
      Math,
      this.layers.map((layer: Layer) => {
        const { top = 0, height = 0, type } = layer;
        if (type === 'artboard') {
          return 0;
        }
        return top + height;
      })
    );
  }

  /**
   * 创建Artboard
   * params: {
   *  backgroundColor,
   *  width,
   *  height,
   * }
   */
  createArtboard(layer: Layer): SimpleCanvas {
    const { backgroundColor = '#cccccc', width, height } = layer;
    const { ctx } = this;

    ctx.setFillStyle(backgroundColor);
    ctx.fillRect(0, 0, width, height);
    ctx.fill();

    layer.type = 'artboard';
    addLayer.call(this, layer);
    return this;
  }

  /**
   * 创建Rectangle
   * params: {
   * left,
   * top,
   * width,
   * height,
   * radius,
   * path,
   * borderColor,
   * borderWidth,
   * backgroundColor
   *  referLayer: { // 相对位置在这里设置后外层top, left 失效
   *    id,
   *    top,
   *    left,
   *  }
   * }
   */
  createRectangle(layer: Layer): SimpleCanvas {
    const {
      left: x,
      top: y,
      width: w,
      height: h,
      radius: r = 0,
      path,
      borderColor,
      borderWidth,
      backgroundColor
    } = relativePosition.call(this, layer);
    const { ctx } = this;

    ctx.save();
    ctx.beginPath();
    ctx.arc(x + r, y + r, r, Math.PI, Math.PI * 1.5);
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.lineTo(x + w, y + r);
    ctx.arc(x + w - r, y + r, r, Math.PI * 1.5, Math.PI * 2);
    ctx.lineTo(x + w, y + h - r);
    ctx.lineTo(x + w - r, y + h);
    ctx.arc(x + w - r, y + h - r, r, 0, Math.PI * 0.5);
    ctx.lineTo(x + r, y + h);
    ctx.lineTo(x, y + h - r);
    ctx.arc(x + r, y + h - r, r, Math.PI * 0.5, Math.PI);
    ctx.lineTo(x, y + r);
    ctx.lineTo(x + r, y);
    if (backgroundColor) {
      ctx.setFillStyle(backgroundColor);
      ctx.fill();
    }
    if (path) {
      ctx.clip();
      ctx.drawImage(path, x, y, w, h);
    }
    if (borderColor) {
      borderWidth && ctx.setLineWidth(borderWidth);
      ctx.setStrokeStyle(borderColor);
      ctx.stroke();
    }
    ctx.restore();

    layer.type = 'rectangle';
    addLayer.call(this, layer);
    return this;
  }

  /**
   * 创建Image
   * params: {
   *  path,
   *  backgroundColor,
   *  top,
   *  left,
   *  width,
   *  height,
   *  referLayer: { // 相对位置在这里设置后外层top, left 失效
   *    id,
   *    top,
   *    left,
   *  }
   * }
   */
  drawImage(layer: Layer): SimpleCanvas {
    const {
      left,
      top,
      path,
      width,
      height,
      mode,
      sWidth,
      sHeight
    } = relativePosition.call(this, layer);
    const { ctx, scale } = this;

    if (mode && mode === 'center') {
      let sLeft = 0;
      let sTop = 0;
      let _width = 0;
      let _height = 0;

      _width = sWidth;
      _height = height * (sWidth / width);

      if (_height > sHeight) {
        _height = sHeight;
        _width = width * (sHeight / height);
      }

      sLeft = (sWidth - _width) / 2;
      sTop = (sHeight - _height) / 2;

      ctx.drawImage(
        path,
        sLeft / scale,
        sTop / scale,
        _width / scale,
        _height / scale,
        left,
        top,
        width,
        height
      );
    } else {
      ctx.drawImage(path, left, top, width, height);
    }

    layer.type = 'image';
    addLayer.call(this, layer);
    return this;
  }

  drawCircleImage(layer: Layer): SimpleCanvas {
    const { left, top, path, d = 0 } = relativePosition.call(this, layer);
    const { ctx } = this;
    ctx.save();
    // 绘制头像
    ctx.beginPath();
    // 先画个圆，前两个参数确定了圆心 （x,y） 坐标  第三个参数是圆的半径  四参数是绘图方向  默认是false，即顺时针
    const r = d / 2;
    const cx = left + r;
    const cy = top + r;
    ctx.arc(cx, cy, r, 0, Math.PI * 2, false);
    ctx.clip(); // 画好了圆 剪切  原始画布中剪切任意形状和尺寸。
    // 一旦剪切了某个区域，则所有之后的绘图都会被限制在被剪切的区域内 这也是我们要save上下文的原因
    ctx.drawImage(path, left, top, d, d);
    ctx.restore(); // 恢复之前保存的绘图上下文 恢复之前保存的绘图问下文即状态 还可以继续绘制

    layer.type = 'circleImage';
    layer.height = layer.d;
    layer.width = layer.d;
    addLayer.call(this, layer);
    return this;
  }

  /**
   * 创建可换行文字
   * params: {
   *  text,
   *  fontSize,
   *  lineHeight,
   *  color,
   *  top,
   *  left,
   *  width,
   *  referLayer: { // 相对位置在这里设置后外层top, left 失效
   *    id,
   *    top,
   *    left,
   *  }
   * }
   */
  drawWrapText(layer: Layer) {
    const {
      left = 0,
      top = 0,
      text = '',
      fontSize = 12,
      fontStyle = '',
      width = 200,
      lineHeight = 1,
      color = '#333333',
      fontFamily = 'Arial',
      maxLine
    } = relativePosition.call(this, layer);

    const { ctx } = this;

    const chr = text.split('');
    const row = [];
    let line = 1;
    let temp = '';
    ctx.font = `${fontStyle} ${fontSize}px ${fontFamily}`;
    ctx.setFontSize(fontSize);
    for (let a = 0; a < chr.length; ) {
      // 每行至少展示一个字符
      if (ctx.measureText(temp + chr[a]).width < width || temp.length === 0) {
        temp += chr[a++];
      } else if (maxLine && line === maxLine) {
        while (ctx.measureText(temp + '...').width > width && temp.length > 1) {
          temp = temp.slice(0, -1);
        }
        temp += '...';
        break;
      } else {
        line++;
        row.push(temp);
        temp = '';
      }
    }
    row.push(temp);

    let textTop;

    ctx.setFillStyle(color);
    for (let b = 0; b < row.length; b += 1) {
      textTop = top + (fontSize + (b * fontSize + b * lineHeight));
      ctx.fillText(row[b], left, textTop);
    }

    layer.type = 'wrapText';
    layer.height = textTop - top; // 计算出换行后文字高度
    layer.width = ctx.measureText(row[row.length - 1]).width; // 记录最后一行的宽度

    addLayer.call(this, layer);
    return this;
  }

  draw(complete: Function): void {
    const { ctx } = this;
    ctx.draw(false, () => {
      complete && complete();
    });
  }
}

export default SimpleCanvas;
