import {addText} from 'utils/text';
import {centerCrop} from 'utils/pixels';
import StackBlur from 'stackblur-canvas';

const canvasComponents = {
  image(ctx, child) {
    drawImage(ctx, child.frame, child.image);
  },
  filter(ctx, child) {
    const {filter} = child;

    const [name, value] = {
      light_contrast: ['contrast', 0.35],
      heavy_contrast: ['contrast', 0.65],
      light_blur: ['blur', 15],
      heavy_blur: ['blur', 40]
    }[filter];

    applyFilter(ctx, child.frame, name, value);
  },
  text(ctx, child) {
    const rect = addText(ctx, child.textAttrs, child.frame, child.text);
    if (child.frame.join(',') !== rect.join(',')) {
      child.onUpdateRect && child.onUpdateRect(rect);
    }
  },
  rect(ctx, child) {
    ctx.fillStyle = child.fill;
    ctx.fillRect(...child.frame);
  },
  outline(ctx, child) {
    ctx.lineWidth = child.width;
    ctx.strokeStyle = child.color;
    ctx.strokeRect(...child.frame);
  },
  line(ctx, child) {
    ctx.strokeStyle = child.color;
    ctx.lineWidth = child.width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(...child.from);
    ctx.lineTo(...child.to);
    ctx.stroke();
    ctx.strokeStyle = null;
  }
};

const applyFilter = (ctx, frame, name, value) => {
  if (name === 'contrast') {
    applyContrast(ctx, frame, value);
  } else {
    const [x, y, w, h] = frame;
    const scale = window.devicePixelRatio || 1;
    StackBlur.canvasRGB(ctx.canvas, x, y, w*scale, h*scale, value);
  }
};

const applyContrast = (ctx, frame, value) => {
  ctx.fillStyle = `rgba(45, 45, 45, ${value})`;
  ctx.fillRect(...frame);
};

const drawImage = (ctx, frame, img) => {
  const canvasWidth = frame[2];
  const canvasHeight = frame[3];

  const area = {width: img.naturalWidth, height: img.naturalHeight};
  const canvas = {width: frame[2], height: frame[3]};

  const {xPad, yPad, zoneWidth, zoneHeight} = centerCrop(area, canvas);

  ctx.drawImage(img, xPad, yPad, zoneWidth, zoneHeight, 0, 0, canvasWidth, canvasHeight);
};

export const renderCanvasLayout = (ctx, layout) => {
  layout.children.forEach(child => {
    if (!child) return;
    const renderer = canvasComponents[child.type];
    if (!renderer) console.error(`Unknown canvas component: ${child.type}`);
    ctx.save();
    renderer(ctx, child);
    ctx.restore();
  });
};
