import Link from "next/link";
export default function NotFound() { return <div className="placeholder-page page-width"><div className="eyebrow">404 / PAGE NOT FOUND</div><h1>Page not found.</h1><p className="page-intro">The address may have changed. Find available lessons and planned subjects in the atlas.</p><Link className="button button-primary" href="/">Back to the atlas →</Link></div>; }
