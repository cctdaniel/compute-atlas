"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode, type KeyboardEvent as DialogKeyboardEvent } from "react";
import { allLessons, domains } from "@/lib/curriculum";
import { Icon } from "./icon";
import { useProgress } from "./preferences";

/** Keep Tab inside the modal even when Safari skips native link/button tab stops. */
function cycleDialogFocus(event: DialogKeyboardEvent<HTMLDialogElement>) {
  if (event.key !== "Tab") return;
  const items = [...event.currentTarget.querySelectorAll<HTMLElement>('a[href], button:not(:disabled), input:not(:disabled), [tabindex="0"]')].filter((element) => element.getClientRects().length > 0);
  if (!items.length) return;
  const current = items.findIndex((element) => element === document.activeElement);
  const next = event.shiftKey ? current <= 0 ? items.length - 1 : current - 1 : (current + 1) % items.length;
  event.preventDefault();
  items[next].focus();
}

export function Logo() {
  return <Link href="/" className="brand" aria-label="Compute Atlas home"><span className="brand-mark"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="m16 3 12 7v13l-12 7L4 23V10L16 3Zm0 0v27M4 10l12 7 12-7M4 23l12-6 12 6" /></svg></span><span>compute<span className="brand-second">atlas<span className="brand-period">.</span></span></span></Link>;
}

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const currentLesson = allLessons.find((lesson) => lesson.href === pathname);
  const currentDomain = pathname === "/" ? domains[0] : domains.find((domain) => pathname === `/${domain.slug}` || pathname.startsWith(`/${domain.slug}/`));
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<string | null>(null);
  const search = useRef<HTMLDialogElement>(null);
  const searchTrigger = useRef<HTMLButtonElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const searchOpener = useRef<HTMLElement | null>(null);
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const openSearch = useCallback((opener: HTMLElement | null) => {
    searchOpener.current = opener && opener !== document.body ? opener : searchTrigger.current;
    search.current?.showModal();
  }, []);
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
        if (!menu.current?.open) openSearch(document.activeElement instanceof HTMLElement ? document.activeElement : null);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [openSearch]);

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
  const results = allLessons.filter((lesson) => (query.trim() || lesson.status === "available") && `${lesson.title} ${lesson.tag} ${lesson.chapter}`.toLowerCase().includes(query.trim().toLowerCase()));

  function navigation() {
    return <>
      <div className="sidebar-intro">A field guide to computer science.</div>
      <nav className="primary-nav" aria-label="Your learning">
        <Link onClick={closeMenu} href="/" aria-current={pathname === "/" || pathname === "/ai-ml" ? "page" : undefined} className={pathname === "/" || pathname === "/ai-ml" ? "nav-item current" : "nav-item"}><Icon name="compass" /> Explore the atlas</Link>
        <Link onClick={closeMenu} href="/saved" aria-current={pathname === "/saved" ? "page" : undefined} className={pathname === "/saved" ? "nav-item current" : "nav-item"}><Icon name="bookmark" /> Saved lessons <span className="nav-count">{saved.length}</span></Link>
      </nav>
      <div className="nav-label">SUBJECTS <span>{domains.length}</span></div>
      <nav className="domain-nav" aria-label="Computer science subjects">
        {domains.map((domain, index) => <Link onClick={closeMenu} href={index === 0 ? "/" : `/${domain.slug}`} className={`domain-item ${currentDomain?.slug === domain.slug && pathname !== "/saved" ? "active" : ""}`} key={domain.slug} aria-current={currentDomain?.slug === domain.slug && pathname !== "/saved" ? "page" : undefined}>
          <Icon name={domain.icon} size={19} /><span>{domain.short === "AI & ML" ? "AI & Machine learning" : domain.short}</span>{index === 0 ? <span className="live-dot" /> : <span className="soon-label">Planned</span>}
        </Link>)}
      </nav>
      <div className="sidebar-bottom"><div className="theme-control" role="group" aria-label="Color theme">{(["light", "dark", "system"] as const).map((value) => <button key={value} onClick={() => changeTheme(value)} aria-label={`${value[0].toUpperCase() + value.slice(1)} theme`} aria-pressed={theme === value} className={theme === value ? "selected" : ""}><Icon name={value === "light" ? "sun" : value === "dark" ? "moon" : "monitor"} size={17} /><span>{value[0].toUpperCase() + value.slice(1)}</span></button>)}</div><span className="sidebar-footnote">Your progress stays on this device.</span></div>
    </>;
  }

  return <>
    <a href="#main-content" className="skip-link">Skip to content</a>
    <aside className="sidebar"><Logo />{navigation()}</aside>
    <div className="app-main">
      <header className="topbar">
        <div className="mobile-brand"><Logo /></div>
        <div className="breadcrumb"><Link href="/">The atlas</Link><Icon name="chevron" size={13} /><span>{pathname === "/saved" ? "Saved lessons" : currentDomain?.title || "Page not found"}</span>{currentLesson && <><Icon name="chevron" size={13} /><span className="breadcrumb-lesson">{currentLesson.title}</span></>}</div>
        <div className="topbar-actions"><span className="topbar-note"><span className="live-dot" /> Always a little more to discover</span><button ref={searchTrigger} className="search-trigger" onClick={() => openSearch(searchTrigger.current)} aria-label="Search lessons"><Icon name="search" size={17} /><span>Search lessons</span><kbd>⌘ K</kbd></button><button ref={menuTrigger} className="icon-button mobile-menu-button" aria-label="Open navigation" aria-expanded={menuOpen} onClick={() => { menu.current?.showModal(); menuHeader.current?.focus({ preventScroll: true }); setMenuOpen(true); }}><Icon name="menu" /></button></div>
      </header>
      <main id="main-content" tabIndex={-1}>{children}</main>
      <footer className="site-footer"><span>compute atlas<span className="brand-period">.</span></span><span>Visual lessons in computer science.</span><Link href="/#learning-path">Learning path <Icon name="arrow" size={15} /></Link></footer>
    </div>
    <dialog ref={menu} onKeyDown={cycleDialogFocus} className="mobile-navigation" aria-label="Navigation" onClose={() => { setMenuOpen(false); menuTrigger.current?.focus({ preventScroll: true }); }}><div className="mobile-navigation-header" ref={menuHeader} tabIndex={-1}><Logo /><button className="icon-button" onClick={closeMenu} aria-label="Close navigation"><Icon name="close" /></button></div><div className="mobile-navigation-content">{navigation()}</div></dialog>
    <dialog ref={search} onKeyDown={cycleDialogFocus} className="search-dialog" aria-label="Search lessons" onClose={() => { (searchOpener.current?.isConnected ? searchOpener.current : searchTrigger.current)?.focus({ preventScroll: true }); }} onClick={(event) => { if (event.target === event.currentTarget) search.current?.close(); }}>
      <div className="search-dialog-inner">
        <div className="search-field"><Icon name="search" /><input ref={searchInput} autoFocus type="search" name="lesson-search" autoComplete="off" aria-label="Search all lessons" placeholder="Search a concept…" value={query} onChange={(event) => setQuery(event.target.value)} /><button onClick={() => search.current?.close()} className="icon-button" aria-label="Close search"><Icon name="close" /></button></div>
        <div className="search-results">
          <p className="search-summary" role="status">{query.trim() ? `${results.length} ${results.length === 1 ? "result" : "results"}` : `${allLessons.filter((lesson) => lesson.status === "available").length} lessons available. Search all 190 reference topics and the starter path.`}</p>
          {results.length ? (["available", "planned"] as const).map((status) => {
            const group = results.filter((lesson) => lesson.status === status);
            const ResultLink = status === "available" ? Link : "a";
            return group.length ? <section className="search-group" key={status} aria-label={status === "available" ? "Available lessons" : "Planned concepts"}>
              <h2 className="eyebrow">{status === "available" ? "AVAILABLE TO READ" : "PLANNED CONCEPTS"}<span>{group.length}</span></h2>
              {group.map((lesson) => <ResultLink href={status === "available" ? lesson.href : lesson.roadmapHref} key={lesson.slug} className="search-result" onClick={() => search.current?.close()}>
                <Icon name={status === "available" ? "book" : "clock"} size={18} /><span><strong>{lesson.title}</strong><small>{lesson.tag} · {lesson.chapter}</small></span><span className={status === "available" ? "status-badge" : "planned-label"}>{status === "available" ? completed.includes(lesson.slug) ? "Completed" : "Read" : "Roadmap"}</span>
              </ResultLink>)}
            </section> : null;
          }) : <div className="empty-search"><h2>No matching concepts</h2><p>Try a broader term, such as “data” or “neural”.</p><button className="text-button" onClick={() => { setQuery(""); searchInput.current?.focus({ preventScroll: true }); }}>Clear search <Icon name="reset" size={16} /></button></div>}
        </div>
        <div className="search-footer">Planned concepts open their chapter on the roadmap.<kbd>Esc to close</kbd></div>
      </div>
    </dialog>
  </>;
}
