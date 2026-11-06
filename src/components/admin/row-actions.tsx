"use client";

import { Fragment, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { MoreIcon } from "@/components/icons";

export type AdminRowTool = {
  key: string;
  label: string;
  icon: ReactNode;
  href?: string;
  external?: boolean;
  danger?: boolean;
  disabled?: boolean;
  labeled?: boolean;
  onClick?: () => void;
};

export type AdminRowMenuItem = {
  key: string;
  label: string;
  icon: ReactNode;
  href?: string;
  external?: boolean;
  danger?: boolean;
  disabled?: boolean;
  onClick?: () => void;
};

function toolClass(tool: AdminRowTool) {
  return [
    "admin-ledger__tool",
    tool.labeled ? "admin-ledger__tool--label" : "",
    tool.danger ? "is-danger" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function AdminRowActions({
  id,
  tools,
  items = [],
  open = false,
  onToggle,
  onClose,
}: {
  id: string | number;
  tools: AdminRowTool[];
  items?: AdminRowMenuItem[];
  open?: boolean;
  onToggle?: () => void;
  onClose?: () => void;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const menuId = `admin-ledger-menu-${id}`;

  useLayoutEffect(() => {
    if (!open) {
      setCoords(null);
      return;
    }

    function place() {
      const trigger = triggerRef.current;
      const menu = menuRef.current;
      if (!trigger || !menu) return;
      const r = trigger.getBoundingClientRect();
      const menuW = menu.offsetWidth;
      const menuH = menu.offsetHeight;
      const gap = 6;
      const pad = 8;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const below = r.bottom + gap;
      const above = r.top - gap - menuH;
      const top =
        below + menuH <= vh - pad || above < pad
          ? Math.min(below, Math.max(pad, vh - menuH - pad))
          : above;
      const left = Math.min(Math.max(pad, r.right - menuW), Math.max(pad, vw - menuW - pad));
      setCoords({ top, left });
    }

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !coords) return;
    menuRef.current?.querySelector<HTMLElement>("[role='menuitem']")?.focus({ preventScroll: true });
  }, [open, coords]);

  useEffect(() => {
    if (!open || !onClose) return;
    const close = onClose;

    function onPointerDown(event: PointerEvent) {
      const node = event.target as Node;
      if (triggerRef.current?.contains(node) || menuRef.current?.contains(node)) return;
      close();
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        triggerRef.current?.focus();
        return;
      }

      if (!menuRef.current) return;
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp" && event.key !== "Home" && event.key !== "End") {
        return;
      }

      const nodes = Array.from(menuRef.current.querySelectorAll<HTMLElement>("[role='menuitem']"));
      if (nodes.length === 0) return;
      event.preventDefault();
      const current = nodes.indexOf(document.activeElement as HTMLElement);
      let next = 0;
      if (event.key === "ArrowDown") next = current < 0 ? 0 : (current + 1) % nodes.length;
      if (event.key === "ArrowUp") next = current < 0 ? nodes.length - 1 : (current - 1 + nodes.length) % nodes.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = nodes.length - 1;
      nodes[next]?.focus();
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  const hasMenu = items.length > 0;
  const menu = open && hasMenu && onClose
    ? createPortal(
        <div
          ref={menuRef}
          id={menuId}
          className="admin-ledger__menu"
          role="menu"
          aria-label="More actions"
          style={{
            top: coords?.top ?? 0,
            left: coords?.left ?? -9999,
            visibility: coords ? "visible" : "hidden",
          }}
        >
          {items.map((item, index) => {
            const body = (
              <>
                {item.icon}
                {item.label}
              </>
            );
            const run = () => {
              onClose?.();
              item.onClick?.();
            };
            return (
              <Fragment key={item.key}>
                {item.danger && index > 0 ? <div className="admin-ledger__menu-sep" role="separator" /> : null}
                {item.href ? (
                  <Link
                    href={item.href}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noreferrer" : undefined}
                    className={`admin-ledger__menu-item${item.danger ? " is-danger" : ""}`}
                    role="menuitem"
                    onClick={onClose}
                  >
                    {body}
                  </Link>
                ) : (
                  <button
                    type="button"
                    className={`admin-ledger__menu-item${item.danger ? " is-danger" : ""}`}
                    role="menuitem"
                    disabled={item.disabled}
                    onClick={run}
                  >
                    {body}
                  </button>
                )}
              </Fragment>
            );
          })}
        </div>,
        document.body
      )
    : null;

  return (
    <div className="admin-ledger__acts">
      {tools.map((tool) =>
        tool.href ? (
          <Link
            key={tool.key}
            href={tool.href}
            target={tool.external ? "_blank" : undefined}
            rel={tool.external ? "noreferrer" : undefined}
            className={toolClass(tool)}
            title={tool.label}
            aria-label={tool.label}
          >
            {tool.icon}
            {tool.labeled ? tool.label : null}
          </Link>
        ) : (
          <button
            key={tool.key}
            type="button"
            className={toolClass(tool)}
            title={tool.label}
            aria-label={tool.label}
            disabled={tool.disabled}
            onClick={tool.onClick}
          >
            {tool.icon}
            {tool.labeled ? tool.label : null}
          </button>
        )
      )}
      {hasMenu ? (
        <button
          ref={triggerRef}
          type="button"
          className={`admin-ledger__tool${open ? " is-open" : ""}`}
          title="More"
          aria-label="More actions"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={menuId}
          onClick={onToggle}
        >
          <MoreIcon />
        </button>
      ) : null}
      {menu}
    </div>
  );
}
