import {
  closestCenter,
  pointerWithin,
  type CollisionDetection,
  type DragEndEvent,
} from "@dnd-kit/core";

type RectLike = Pick<DOMRect, "bottom" | "left" | "right" | "top">;

export const cardCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);

  return pointerCollisions.length > 0 ? pointerCollisions : closestCenter(args);
};

function getDistanceToRect(rect: RectLike, clientX: number, clientY: number) {
  const distanceX = Math.max(rect.left - clientX, 0, clientX - rect.right);
  const distanceY = Math.max(rect.top - clientY, 0, clientY - rect.bottom);

  return distanceX ** 2 + distanceY ** 2;
}

function getLayoutRect(node: HTMLElement) {
  const offsetParent =
    node.offsetParent instanceof HTMLElement ? node.offsetParent : null;
  const parentRect = offsetParent?.getBoundingClientRect();
  const fallbackRect = node.getBoundingClientRect();
  const left = parentRect
    ? parentRect.left + node.offsetLeft
    : fallbackRect.left;
  const top = parentRect ? parentRect.top + node.offsetTop : fallbackRect.top;

  return {
    bottom: top + node.offsetHeight,
    left,
    right: left + node.offsetWidth,
    top,
  };
}

export function getDragEndPoint(event: DragEndEvent) {
  const sourceEvent = event.activatorEvent;

  if (
    sourceEvent instanceof MouseEvent ||
    sourceEvent instanceof PointerEvent
  ) {
    return {
      x: sourceEvent.clientX + event.delta.x,
      y: sourceEvent.clientY + event.delta.y,
    };
  }

  return null;
}

export function getSortableSymbolFromPoint(
  clientX: number,
  clientY: number,
  activeSymbol: string,
) {
  let closest: {
    distance: number;
    symbol: string;
  } | null = null;

  for (const node of document.querySelectorAll<HTMLElement>(
    "[data-sortable-symbol]",
  )) {
    const symbol = node.dataset.sortableSymbol;

    if (!symbol || symbol === activeSymbol) {
      continue;
    }

    const distance = getDistanceToRect(getLayoutRect(node), clientX, clientY);

    if (!closest || distance < closest.distance) {
      closest = {
        distance,
        symbol,
      };
    }
  }

  return closest?.symbol ?? null;
}
