"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const linkClass = (path: string) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      pathname === path
        ? "bg-white text-gray-900 shadow-sm"
        : "text-gray-300 hover:text-white hover:bg-white/10"
    }`;

  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">✍️</span>
            <span className="text-xl font-bold text-white">
              AI Blog Generator
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/" className={linkClass("/")}>
              Blog
            </Link>
            <Link href="/admin" className={linkClass("/admin")}>
              Admin
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
