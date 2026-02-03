"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur-sm">
      <nav className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img
            src="https://unavatar.io/x/moltdns"
            alt="molt dns"
            className="w-8 h-8 rounded-full"
          />
          <span className="font-semibold text-lg">molt dns</span>
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-6 text-sm">
          {[
            { href: "/", label: "home", match: (p: string) => p === "/" },
            { href: "/agents", label: "agents", match: (p: string) => p.startsWith("/agents") },
            { href: "/feed", label: "feed", match: (p: string) => p === "/feed" },
            { href: "/verify", label: "verify", match: (p: string) => p === "/verify" },
            { href: "/register", label: "register", match: (p: string) => p === "/register" },
            { href: "/developers", label: "developers", match: (p: string) => p === "/developers" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`transition-colors ${
                link.match(pathname)
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
