"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, RefreshCw, Link2, Copy, ExternalLink,
  Share2, Search, Printer, Code, Inspect, ZoomIn, ZoomOut,
  RotateCcw, Fullscreen, Image, MoreHorizontal, ChevronRight,
} from "lucide-react";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  action?: () => void;
  disabled?: boolean;
  divider?: boolean;
  shortcut?: string;
  children?: MenuItem[];
}

// Icon grid actions
const NAV_ACTIONS = [
  { id: "back", icon: <ArrowLeft size={16} />, action: () => window.history.back(), label: "Back" },
  { id: "forward", icon: <ArrowRight size={16} />, action: () => window.history.forward(), label: "Forward" },
  { id: "refresh", icon: <RefreshCw size={16} />, action: () => window.location.reload(), label: "Refresh" },
];

// Cross-browser zoom using CSS transform (works on Firefox, Chrome, Safari, Edge)
const getZoomLevel = () => {
  const transform = document.body.style.transform;
  const match = transform.match(/scale\(([^)]+)\)/);
  return match ? parseFloat(match[1]) : 1;
};

const setZoom = (delta: number) => {
  const currentZoom = getZoomLevel();
  const newZoom = Math.max(0.5, Math.min(2, currentZoom + delta));
  document.body.style.transform = `scale(${newZoom})`;
  document.body.style.transformOrigin = "top left";
  document.body.style.width = `${100 / newZoom}%`;
};

const resetZoom = () => {
  document.body.style.transform = "";
  document.body.style.transformOrigin = "";
  document.body.style.width = "";
};

const ZOOM_ACTIONS = [
  { id: "zoomOut", icon: <ZoomOut size={16} />, label: "Zoom Out", action: () => setZoom(-0.1) },
  { id: "resetZoom", icon: <RotateCcw size={16} />, label: "Reset", action: resetZoom },
  { id: "zoomIn", icon: <ZoomIn size={16} />, label: "Zoom In", action: () => setZoom(0.1) },
];

export const CustomContextMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [submenuDir, setSubmenuDir] = useState<"right" | "left">("right");
  const menuRef = useRef<HTMLDivElement>(null);
  const clickPos = useRef({ x: 0, y: 0 });
  const [hasSelection, setHasSelection] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const close = useCallback(() => { setIsOpen(false); setActiveSubmenu(null); }, []);

  // Build menu items based on context
  const menuItems: MenuItem[] = [
    ...(hasSelection ? [
      { id: "copy", label: "Copy", icon: <Copy size={14} />, shortcut: "⌘C",
        action: () => navigator.clipboard.writeText(window.getSelection()?.toString() || "") },
      { id: "search", label: "Search Google", icon: <Search size={14} />, divider: true,
        action: () => window.open(`https://www.google.com/search?q=${encodeURIComponent(window.getSelection()?.toString() || "")}`, "_blank") },
    ] : []),
    ...(imageUrl ? [
      { id: "copyImg", label: "Copy Image URL", icon: <Image size={14} />, action: () => navigator.clipboard.writeText(imageUrl) },
      { id: "openImg", label: "Open Image", icon: <ExternalLink size={14} />, divider: true, action: () => window.open(imageUrl, "_blank") },
    ] : []),
    { id: "copyLink", label: "Copy Link", icon: <Link2 size={14} />, shortcut: "⌘L", action: () => navigator.clipboard.writeText(window.location.href) },
    { id: "share", label: "Share", icon: <Share2 size={14} />, action: async () => {
      if (navigator.share) {
        await navigator.share({ title: document.title, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
      }
    }},
    { id: "newTab", label: "Open in New Tab", icon: <ExternalLink size={14} />, divider: true, action: () => window.open(window.location.href, "_blank") },
    { id: "fullscreen", label: "Fullscreen", icon: <Fullscreen size={14} />, shortcut: "F11", action: () => {
      try {
        const doc = document as Document & {
          webkitFullscreenElement?: Element;
          webkitExitFullscreen?: () => Promise<void>;
        };
        const docEl = document.documentElement as HTMLElement & {
          webkitRequestFullscreen?: () => Promise<void>;
        };
        
        const isFullscreen = document.fullscreenElement || doc.webkitFullscreenElement;
        
        if (isFullscreen) {
          if (document.exitFullscreen) {
            void document.exitFullscreen();
          } else if (doc.webkitExitFullscreen) {
            void doc.webkitExitFullscreen();
          }
        } else {
          if (docEl.requestFullscreen) {
            void docEl.requestFullscreen();
          } else if (docEl.webkitRequestFullscreen) {
            void docEl.webkitRequestFullscreen();
          }
        }
      } catch (error) {
        console.error("Fullscreen error:", error);
      }
    }},
    { id: "print", label: "Print", icon: <Printer size={14} />, shortcut: "⌘P", divider: true, action: () => window.print() },
    { id: "more", label: "More Tools", icon: <MoreHorizontal size={14} />, children: [
      { id: "source", label: "View Source", icon: <Code size={14} />, action: () => {
        const w = window.open("", "_blank");
        if (w) { w.document.body.innerHTML = `<pre style="white-space:pre-wrap;word-break:break-all;padding:16px;font-size:12px">${document.documentElement.outerHTML.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</pre>`; }
      }},
      { id: "inspect", label: "Inspect", icon: <Inspect size={14} />, shortcut: "F12", action: () => {
        // Cannot programmatically open DevTools due to browser security
        // Show a toast/notification instead
        const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
        const shortcut = isMac ? "⌘+Option+I" : "Ctrl+Shift+I or F12";
        alert(`Press ${shortcut} to open Developer Tools`);
      }},
    ]},
  ];

  const handleContextMenu = useCallback((e: MouseEvent) => {
    // Prevent default FIRST to ensure custom menu shows
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const target = e.target as HTMLElement;
      setHasSelection(!!window.getSelection()?.toString());
      setImageUrl(target.tagName === "IMG" ? (target as HTMLImageElement).src : null);
      setActiveSubmenu(null);
      clickPos.current = { x: e.clientX, y: e.clientY };
      setSubmenuDir(e.clientX + 400 > window.innerWidth ? "left" : "right");
      setPosition({ x: Math.min(e.clientX, window.innerWidth - 208), y: e.clientY });
      setIsOpen(true);
    } catch (error) {
      console.error("CustomContextMenu error:", error);
    }
  }, []);

  // Adjust vertical position after render
  useEffect(() => {
    if (!isOpen || !menuRef.current) return;
    const raf = requestAnimationFrame(() => {
      if (!menuRef.current) return;
      const h = menuRef.current.getBoundingClientRect().height;
      const vh = window.innerHeight;
      const y = clickPos.current.y;
      setPosition(p => ({ ...p, y: y + h > vh - 8 ? Math.max(8, y - h > 8 ? y - h : vh - h - 8) : y }));
    });
    return () => cancelAnimationFrame(raf);
  }, [isOpen, hasSelection, imageUrl]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    
    // Use capture phase to intercept event before other handlers
    document.addEventListener("contextmenu", handleContextMenu, { capture: true });
    document.addEventListener("click", close);
    document.addEventListener("keydown", onKey);
    document.addEventListener("scroll", close);
    
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu, { capture: true });
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("scroll", close);
    };
  }, [handleContextMenu, close]);

  const IconBtn = ({ item, onClick }: { item: typeof NAV_ACTIONS[0]; onClick: () => void }) => (
    <button onClick={onClick} className="p-2 rounded-md hover:bg-accent text-popover-foreground transition-colors" title={item.label}>
      {item.icon}
    </button>
  );

  const MenuRow = ({ item }: { item: MenuItem }) => (
    <div className="relative">
      <button
        className={`w-full px-3 py-1.5 flex items-center gap-2 text-left text-sm transition-colors ${item.disabled ? "text-muted-foreground cursor-not-allowed" : "text-popover-foreground hover:bg-accent"}`}
        onClick={() => item.children ? setActiveSubmenu(activeSubmenu === item.id ? null : item.id) : (item.action?.(), close())}
        onMouseEnter={() => item.children && setActiveSubmenu(item.id)}
        disabled={item.disabled}
      >
        <span className="flex-shrink-0 opacity-70">{item.icon}</span>
        <span className="flex-1">{item.label}</span>
        {item.shortcut && <span className="text-xs text-muted-foreground">{item.shortcut}</span>}
        {item.children && <ChevronRight size={12} className="opacity-50" />}
      </button>
      <AnimatePresence>
        {item.children && activeSubmenu === item.id && (
          <motion.div
            className={`absolute top-0 min-w-[140px] rounded-md border border-border bg-popover shadow-lg py-1 ${submenuDir === "right" ? "left-full ml-1" : "right-full mr-1"}`}
            initial={{ opacity: 0, x: submenuDir === "right" ? -8 : 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: submenuDir === "right" ? -8 : 8 }}
            transition={{ duration: 0.1 }}
          >
            {item.children.map(c => (
              <button key={c.id} className="w-full px-3 py-1.5 flex items-center gap-2 text-left text-sm text-popover-foreground hover:bg-accent transition-colors"
                onClick={() => { c.action?.(); close(); }}>
                <span className="opacity-70">{c.icon}</span>
                <span className="flex-1">{c.label}</span>
                {c.shortcut && <span className="text-xs text-muted-foreground">{c.shortcut}</span>}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div ref={menuRef} className="fixed z-[9999] w-[200px] rounded-lg border border-border bg-popover shadow-lg overflow-visible"
          style={{ left: position.x, top: position.y }}
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.12 }}>
          <div className="flex items-center justify-center gap-1 px-2 py-2 border-b border-border">
            {NAV_ACTIONS.map(i => <IconBtn key={i.id} item={i} onClick={() => { i.action(); close(); }} />)}
          </div>
          <div className="py-1">
            {menuItems.map((item, idx) => (
              <div key={item.id}>
                <MenuRow item={item} />
                {item.divider && idx < menuItems.length - 1 && <div className="mx-2 my-1 h-px bg-border" />}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-1 px-2 py-2 border-t border-border">
            {ZOOM_ACTIONS.map(i => <IconBtn key={i.id} item={i} onClick={i.action} />)}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CustomContextMenu;
