function toRectLog(rect) {
  if (!rect) return null;
  return {
    left: Number(rect.left.toFixed(2)),
    top: Number(rect.top.toFixed(2)),
    width: Number(rect.width.toFixed(2)),
    height: Number(rect.height.toFixed(2)),
  };
}

export function getRenderedImageContentRect({ containerEl, imageEl } = {}) {
  if (!containerEl || !imageEl) return null;
  const containerRect = containerEl.getBoundingClientRect();
  const imageRect = imageEl.getBoundingClientRect();
  if (!imageRect.width || !imageRect.height) return null;

  const naturalWidth = Number(imageEl.naturalWidth);
  const naturalHeight = Number(imageEl.naturalHeight);
  if (!Number.isFinite(naturalWidth) || !Number.isFinite(naturalHeight) || naturalWidth <= 0 || naturalHeight <= 0) {
    return {
      containerRect,
      imageRect,
      renderedRect: imageRect,
      overlayLeft: imageRect.left - containerRect.left,
      overlayTop: imageRect.top - containerRect.top,
      width: imageRect.width,
      height: imageRect.height,
    };
  }

  const imageAspect = naturalWidth / naturalHeight;
  const boxAspect = imageRect.width / imageRect.height;
  let renderedWidth = imageRect.width;
  let renderedHeight = imageRect.height;

  if (boxAspect > imageAspect) {
    renderedWidth = imageRect.height * imageAspect;
  } else {
    renderedHeight = imageRect.width / imageAspect;
  }

  const renderedLeft = imageRect.left + ((imageRect.width - renderedWidth) / 2);
  const renderedTop = imageRect.top + ((imageRect.height - renderedHeight) / 2);

  return {
    containerRect,
    imageRect,
    renderedRect: {
      left: renderedLeft,
      top: renderedTop,
      width: renderedWidth,
      height: renderedHeight,
      right: renderedLeft + renderedWidth,
      bottom: renderedTop + renderedHeight,
    },
    overlayLeft: renderedLeft - containerRect.left,
    overlayTop: renderedTop - containerRect.top,
    width: renderedWidth,
    height: renderedHeight,
  };
}

export { toRectLog };
