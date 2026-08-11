"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import NextLink from "next/link";
import type React from "react";
import styles from "./dropdown.module.css";

export type DropdownItem = {
  key: string;
  label: string;
  href?: string;
  disabled?: boolean;
};

export type DropdownProps = {
  /**
   * Trigger content (usually text or an icon+text).
   */
  trigger: React.ReactNode;
  /**
   * Menu items.
   */
  items: DropdownItem[];
  /**
   * Optional callback fired when an enabled item is activated.
   */
  onSelect?: (item: DropdownItem) => void;
  /**
   * Accessible label for the trigger and menu.
   */
  ariaLabel?: string;
  /**
   * Menu horizontal alignment.
   * @default "left"
   */
  align?: "left" | "right";
  /**
   * Extra class for the trigger button (e.g. header nav look).
   */
  triggerClassName?: string;
};

/**
 * Returns enabled menuitem nodes from the open menu.
 * @param {HTMLElement | null} menu - Menu root element.
 * @returns {HTMLElement[]} Enabled menuitems in DOM order.
 */
const getEnabledMenuItems = (menu: HTMLElement | null): HTMLElement[] => {
  if (!menu) {
    return [];
  }

  return Array.from(
    menu.querySelectorAll<HTMLElement>(`[data-dropdown-item="true"][data-disabled="false"]`),
  );
};

/**
 * Accessible dropdown menu primitive (keyboard + outside click).
 * Used for navigation menus such as "Компенсации".
 * @param {DropdownProps} props - Component props.
 * @returns {React.ReactElement} Dropdown element.
 */
export const Dropdown = ({
  trigger,
  items,
  onSelect,
  ariaLabel = "Dropdown menu",
  align = "left",
  triggerClassName,
}: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const menuId = useId();
  const firstEnabledItemKey = useMemo(() => {
    return items.find((item) => !item.disabled)?.key;
  }, [items]);

  /**
   * Closes the menu and restores focus to the trigger for keyboard users.
   */
  const handleClose = () => {
    setIsOpen(false);
    window.setTimeout(() => {
      triggerRef.current?.focus();
    }, 0);
  };

  /**
   * Closes the menu when clicking outside of the dropdown.
   * Side effect: adds document event listeners while open.
   */
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      const wrapper = wrapperRef.current;

      if (!wrapper || !target) {
        return;
      }

      if (!wrapper.contains(target)) {
        setIsOpen(false);
      }
    };

    const handleDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleClose();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown, { passive: true });
    document.addEventListener("keydown", handleDocumentKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleDocumentKeyDown);
    };
  }, [isOpen]);

  /**
   * When opened, focuses the first enabled item for keyboard users.
   */
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const focusFirstEnabled = () => {
      const itemsInMenu = getEnabledMenuItems(menuRef.current);
      itemsInMenu[0]?.focus();
    };

    const timeoutId = window.setTimeout(focusFirstEnabled, 0);
    return () => window.clearTimeout(timeoutId);
  }, [isOpen, firstEnabledItemKey]);

  /**
   * Toggles the menu from the trigger button.
   */
  const handleTriggerClick = () => {
    setIsOpen((prev) => !prev);
  };

  /**
   * Opens/toggles the menu via keyboard on the trigger.
   * @param {React.KeyboardEvent<HTMLButtonElement>} event - Keyboard event.
   */
  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsOpen((prev) => !prev);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
    }
  };

  /**
   * Moves focus between menuitems and closes on Tab/Escape.
   * @param {React.KeyboardEvent<HTMLElement>} event - Keyboard event from a menuitem.
   */
  const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    const enabledItems = getEnabledMenuItems(menuRef.current);

    if (enabledItems.length === 0) {
      return;
    }

    const activeIndex = enabledItems.findIndex((item) => item === document.activeElement);

    if (event.key === "ArrowDown") {
      event.preventDefault();
      const nextIndex = activeIndex < 0 ? 0 : (activeIndex + 1) % enabledItems.length;
      enabledItems[nextIndex]?.focus();
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      const nextIndex =
        activeIndex <= 0 ? enabledItems.length - 1 : (activeIndex - 1) % enabledItems.length;
      enabledItems[nextIndex]?.focus();
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      enabledItems[0]?.focus();
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      enabledItems[enabledItems.length - 1]?.focus();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      handleClose();
      return;
    }

    if (event.key === "Tab") {
      setIsOpen(false);
    }
  };

  /**
   * Activates an item and closes the dropdown.
   * @param {DropdownItem} item - Activated item.
   */
  const handleItemActivate = (item: DropdownItem) => {
    if (item.disabled) {
      return;
    }

    onSelect?.(item);
    setIsOpen(false);
  };

  /**
   * Activates a menuitem via Enter/Space.
   * @param {React.KeyboardEvent<HTMLElement>} event - Keyboard event.
   * @param {DropdownItem} item - Target item.
   */
  const handleItemKeyDown = (
    event: React.KeyboardEvent<HTMLElement>,
    item: DropdownItem,
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleItemActivate(item);
      return;
    }

    handleMenuKeyDown(event);
  };

  return (
    <div ref={wrapperRef} className={styles.dropdown}>
      <button
        ref={triggerRef}
        type="button"
        className={[styles.dropdown__trigger, triggerClassName ?? ""].filter(Boolean).join(" ")}
        onClick={handleTriggerClick}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-label={ariaLabel}
      >
        {trigger}
      </button>

      {isOpen && (
        <div
          id={menuId}
          ref={menuRef}
          role="menu"
          aria-label={ariaLabel}
          className={[
            styles.dropdown__menu,
            align === "right" ? styles["dropdown__menu--right"] : "",
          ].join(" ")}
          onKeyDown={handleMenuKeyDown}
        >
          {items.map((item) => {
            const isDisabled = Boolean(item.disabled);
            const className = [
              styles.dropdown__item,
              isDisabled ? styles["dropdown__item--disabled"] : "",
            ].join(" ");

            if (item.href && !isDisabled) {
              return (
                <NextLink
                  key={item.key}
                  href={item.href}
                  prefetch
                  role="menuitem"
                  className={className}
                  data-dropdown-item="true"
                  data-disabled="false"
                  tabIndex={-1}
                  onClick={() => handleItemActivate(item)}
                  onKeyDown={(event) => handleItemKeyDown(event, item)}
                >
                  {item.label}
                </NextLink>
              );
            }

            return (
              <button
                key={item.key}
                type="button"
                role="menuitem"
                className={className}
                disabled={isDisabled}
                data-dropdown-item="true"
                data-disabled={isDisabled ? "true" : "false"}
                tabIndex={-1}
                onClick={() => handleItemActivate(item)}
                onKeyDown={(event) => handleItemKeyDown(event, item)}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
