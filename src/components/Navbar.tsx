"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="border-b border-[#222] bg-[#0a0a0a]">
      <nav className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-80">
          <img
            src="https://unavatar.io/x/moltdns"
            alt="molt dns"
            className="w-8 h-8 rounded-full"
          />
          <span className="font-semibold text-lg">molt dns</span>
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-6 text-sm">
          <Link
            href="/"
            className={`hover:text-white ${pathname === "/" ? "text-white" : "text-[#888]"}`}
          >
            home
          </Link>
          <Link
            href="/agents"
            className={`hover:text-white ${pathname.startsWith("/agents") ? "text-white" : "text-[#888]"}`}
          >
            agents
          </Link>
          <Link
            href="/feed"
            className={`hover:text-white ${pathname === "/feed" ? "text-white" : "text-[#888]"}`}
          >
            feed
          </Link>
          <Link
            href="/verify"
            className={`hover:text-white ${pathname === "/verify" ? "text-white" : "text-[#888]"}`}
          >
            verify
          </Link>
          <Link
            href="/register"
            className={`hover:text-white ${pathname === "/register" ? "text-white" : "text-[#888]"}`}
          >
            register
          </Link>
          <Link
            href="/developers"
            className={`hover:text-white ${pathname === "/developers" ? "text-white" : "text-[#888]"}`}
          >
            developers
          </Link>
        </div>
      </nav>
    </header>
  );
}
