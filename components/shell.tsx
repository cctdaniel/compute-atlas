"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { allLessons, domains } from "@/lib/curriculum";
import { Icon } from "./icon";
import { useProgress } from "./preferences";

export function Logo() {
  return <Link href="/" className="brand" aria-label="Compute Atlas home"><span className="brand-mark"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="m16 3 12 7v13l-12 7L4 23V10L16 3Zm0 0v27M4 10l12 7 12-7M4 23l12-6 12 6" /></svg></span><span>compute<span className="brand-second">atlas<span className="brand-period">.</span></span></span></Link>;
}

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLesson = pathname.includes("gradient-descent");
  const currentDomain = domains.find((domain) => pathname.startsWith(`/${domain.slug}`)) || domains[0];
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<string | null>(null);
  const search = useRef<HTMLDialogElement>(null);
  const menu = useRef<HTMLDialogElement>(null);
  const menuHeader = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const { saved, completed } = useProgress();

  useEffect(() => {
    const stored = document.documentElement.dataset.preference;
    // The server cannot read this browser preference; hydrate it once after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(stored || "system");
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        if (!menu.current?.open) search.current?.showModal();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (!theme) return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      document.documentElement.dataset.theme = theme === "system" ? (media.matches ? "dark" : "light") : theme;
      document.documentElement.dataset.preference = theme;
      const background = getComputedStyle(document.documentElement).getPropertyValue("--background").trim();
      document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
        meta.content = background;
      });
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);

  function changeTheme(value: string) {
    setTheme(value);
    try { localStorage.setItem("compute-atlas-theme", value); } catch { /* Theme still applies for this session. */ }
  }
  function closeMenu() { menu.current?.close(); setMenuOpen(false); }
  const results = allLessons.filter((lesson) => `${lesson.title} ${lesson.tag} ${lesson.chapter}`.toLowerCase().includes(query.toLowerCase()));

  function navigation() {
    return <>
      <div className="sidebar-intro">A field guide to computer science.</div>
      <nav className="primary-nav" aria-label="Your learning">
        <Link onClick={closeMenu} href="/" className={pathname === "/" || pathname === "/ai-ml" ? "nav-item current" : "nav-item"}><Icon name="compass" /> Explore the atlas</Link>
        <Link onClick={closeMenu} href="/saved" className={pathname === "/saved" ? "nav-item current" : "nav-item"}><Icon name="bookmark" /> Saved lessons <span className="nav-count">{saved.length}</span></Link>
      </nav>
      <div className="nav-label">THE SUBJECTS <span>01 / 06</span></div>
      <nav className="domain-nav" aria-label="Computer science subjects">
        {domains.map((domain, index) => <Link onClick={closeMenu} href={index === 0 ? "/" : `/${domain.slug}`} className={`domain-item ${currentDomain.slug === domain.slug && pathname !== "/saved" ? "active" : ""}`} key={domain.slug} aria-current={currentDomain.slug === domain.slug && pathname !== "/saved" ? "page" : undefined}>
          <Icon name={domain.icon} size={19} /><span>{domain.short === "AI & ML" ? "AI & Machine learning" : domain.short}</span>{index === 0 ? <span className="live-dot" /> : <span className="soon-label">SOON</span>}
        </Link>)}
      </nav>
      <div className="sidebar-bottom"><div className="theme-control" role="group" aria-label="Color theme">{(["light", "dark", "system"] as const).map((value) => <button key={value} onClick={() => changeTheme(value)} aria-label={`${value[0].toUpperCase() + value.slice(1)} theme`} aria-pressed={theme === value} className={theme === value ? "selected" : ""}><Icon name={value === "light" ? "sun" : value === "dark" ? "moon" : "monitor"} size={17} /><span>{value[0].toUpperCase() + value.slice(1)}</span></button>)}</div><span className="sidebar-footnote">Made for the joy of understanding.</span></div>
    </>;
  }

  return <>
    <a href="#main-content" className="skip-link">Skip to content</a>
    <aside className="sidebar"><Logo />{navigation()}</aside>
    <div className="app-main">
      <header className="topbar">
        <div className="mobile-brand"><Logo /></div>
        <div className="breadcrumb"><Link href="/">The atlas</Link><Icon name="chevron" size={13} /><span>{pathname === "/saved" ? "Saved lessons" : currentDomain.title}</span>{isLesson && <><Icon name="chevron" size={13} /><span className="breadcrumb-lesson">How machines learn</span></>}</div>
        <div className="topbar-actions"><span className="topbar-note"><span className="live-dot" /> Always a little more to discover</span><button className="search-trigger" onClick={() => search.current?.showModal()} aria-label="Search lessons"><Icon name="search" size={17} /><span>Search anything</span><kbd>⌘ K</kbd></button><button className="icon-button mobile-menu-button" aria-label="Open navigation" aria-expanded={menuOpen} onClick={() => { menu.current?.showModal(); menuHeader.current?.focus({ preventScroll: true }); setMenuOpen(true); }}><Icon name="menu" /></button></div>
      </header>
      <main id="main-content" tabIndex={-1}>{children}</main>
      <footer className="site-footer"><span>compute atlas<span className="brand-period">.</span></span><span>Understanding is a journey, not a destination.</span><Link href="/#learning-path">Keep exploring <Icon name="arrow" size={15} /></Link></footer>
    </div>
    <dialog ref={menu} className="mobile-navigation" aria-label="Navigation" onClose={() => setMenuOpen(false)}><div className="mobile-navigation-header" ref={menuHeader} tabIndex={-1}><Logo /><button className="icon-button" onClick={closeMenu} aria-label="Close navigation"><Icon name="close" /></button></div>{navigation()}</dialog>
    <dialog ref={search} className="search-dialog" onClick={(event) => { if (event.target === event.currentTarget) search.current?.close(); }}><div className="search-dialog-inner"><div className="search-field"><Icon name="search" /><input autoFocus aria-label="Search all lessons" placeholder="What are you curious about?" value={query} onChange={(event) => setQuery(event.target.value)} /><button onClick={() => search.current?.close()} className="icon-button" aria-label="Close search"><Icon name="close" /></button></div><div className="search-results"><div className="eyebrow">{query ? `${results.length} matching lessons` : "Explore the AI & ML roadmap"}</div>{results.length ? results.map((lesson) => <Link href={lesson.status === "available" ? lesson.href : lesson.roadmapHref} key={lesson.slug} className="search-result" onClick={() => search.current?.close()}><Icon name={lesson.status === "available" ? "book" : "clock"} size={18} /><span><strong>{lesson.title}</strong><small>{lesson.tag} · {lesson.chapter}</small></span><span className={lesson.status === "available" ? "status-badge" : "planned-label"}>{lesson.status === "available" ? completed.includes(lesson.slug) ? "Completed" : "Read lesson" : "Planned"}</span></Link>) : <div className="empty-search"><p>No lessons found for “{query}”.</p><button className="text-button" onClick={() => setQuery("")}>Explore all lessons <Icon name="arrow" size={16} /></button></div>}</div><div className="search-footer">Available lessons open directly. Planned lessons link to the roadmap.<kbd>esc to close</kbd></div></div></dialog>
  </>;
}
