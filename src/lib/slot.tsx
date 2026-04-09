import * as React from "react";

type AnyProps = Record<string, unknown>;

function mergeProps(slotProps: AnyProps, childProps: AnyProps): AnyProps {
  const merged: AnyProps = { ...childProps };
  for (const key in slotProps) {
    const slotVal = slotProps[key];
    const childVal = childProps[key];
    if (/^on[A-Z]/.test(key) && typeof slotVal === "function") {
      merged[key] =
        typeof childVal === "function"
          ? (...args: unknown[]) => {
              (childVal as (...a: unknown[]) => unknown)(...args);
              (slotVal as (...a: unknown[]) => unknown)(...args);
            }
          : slotVal;
    } else if (key === "className") {
      merged.className = [slotVal, childVal].filter(Boolean).join(" ");
    } else if (key === "style") {
      merged.style = {
        ...(slotVal as React.CSSProperties),
        ...(childVal as React.CSSProperties),
      };
    } else {
      merged[key] = slotVal;
    }
  }
  return merged;
}

export function asChildProps(
  asChild: boolean | undefined,
  children: React.ReactNode,
): { render?: React.ReactElement; children?: React.ReactNode } {
  if (asChild && React.isValidElement(children))
    return { render: children as React.ReactElement };
  return { children };
}

export const Slot = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }
>(function Slot({ children, ...props }, ref) {
  if (!React.isValidElement(children)) return null;
  const childProps = (children.props as AnyProps) ?? {};
  return React.cloneElement(children, {
    ...mergeProps(props as AnyProps, childProps),
    ref,
  } as never);
});
