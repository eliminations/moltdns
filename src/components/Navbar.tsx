"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "home", match: (p: string) => p === "/" },
    { href: "/agents", label: "agents", match: (p: string) => p.startsWith("/agents") },
    { href: "/feed", label: "feed", match: (p: string) => p === "/feed" },
    { href: "/verify", label: "verify", match: (p: string) => p === "/verify" },
    { href: "/register", label: "register", match: (p: string) => p === "/register" },
  ];

  return (
    <header className="border-b border-border">
      <nav className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <span className="text-sm leading-none">🦞</span>
          <span className="text-xs uppercase tracking-widest">molt dns</span>
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-full text-xs uppercase tracking-wider transition-colors ${
                link.match(pathname)
                  ? "text-foreground bg-secondary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/developers"
            className={`ml-2 px-3 py-1.5 rounded-full text-xs uppercase tracking-wider border transition-colors ${
              pathname === "/developers"
                ? "border-primary/50 text-primary"
                : "border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
            }`}
          >
            docs
          </Link>
        </div>
      </nav>
    </header>
  );
}
