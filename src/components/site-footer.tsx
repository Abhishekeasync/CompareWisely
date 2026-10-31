import Link from "next/link";
import { LinkedInIcon, XIcon, YouTubeIcon } from "./icons";

export function SiteFooter({ year }: { year: number }) {

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div>
            <Link className="brand" href="/">
              CompareWisely
            </Link>
            <p className="muted tiny brand-blurb">
              India&apos;s independent comparison platform for ERP and accounting software. Built for MSMEs, CAs and finance teams.
            </p>
            <div className="social">
              <a href="#" aria-label="X">
                <XIcon />
              </a>
              <a href="#" aria-label="LinkedIn">
                <LinkedInIcon />
              </a>
              <a href="#" aria-label="YouTube">
                <YouTubeIcon />
              </a>
            </div>
          </div>
          <nav className="footer__col" aria-label="Compare">
            <h4>Compare</h4>
            <Link href="/compare/tally-prime-vs-zoho-books">Tally Prime vs Zoho Books</Link>
            <span className="footer__soon">Busy vs Marg ERP</span>
            <span className="footer__soon">Zoho Books vs Vyapar</span>
          </nav>
          <nav className="footer__col" aria-label="Learn">
            <h4>Learn</h4>
            <Link href="/blog">Blog</Link>
            <Link href="/blog/gstr-2b-reconciliation">GSTR-2B reconciliation</Link>
            <Link href="/find-your-best-fit">Find your best fit</Link>
            <span className="footer__soon">TDS thresholds</span>
          </nav>
          <nav className="footer__col" aria-label="Updates and company">
            <h4>Updates &amp; company</h4>
            <Link href="/finance-updates">Finance updates</Link>
            <span className="footer__soon">GST due dates</span>
            <span className="footer__soon">About &amp; editorial policy</span>
          </nav>
        </div>
        <div className="footer__bottom">
          <p className="disclaimer">
            <b>Disclaimer:</b> Information is for general guidance only. Verify prices and rules with the official source before deciding. CompareWisely is not affiliated with the software vendors reviewed. © {year} CompareWisely.
          </p>
          <div className="row gap-16 tiny">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <a href="mailto:contact@comparewisely.com">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
