import Link from "next/link";
import { learningCommunities, publicNavigation } from "../../lib/public-site-content";

const navLinkClass =
  "inline-flex min-h-10 items-center text-sm text-white/75 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

export function SchoolFooter() {
  const portal = publicNavigation.find((item) => item.href === "/");
  const primaryLinks = publicNavigation.filter((item) =>
    ["About", "Academics", "School Life", "News", "Events", "Contact"].includes(item.label),
  );

  return (
    <footer className="bg-brand text-white">
      <div className="mx-auto grid max-w-[1600px] gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.3fr_1fr_1fr] lg:px-12 lg:py-16">
        <div>
          <Link href="/school" className="inline-flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-sm border border-white/30 text-sm font-semibold">
              G
            </span>
            <span>
              <span className="block text-xs font-bold uppercase">Greenfield Schools</span>
              <span className="font-display mt-0.5 block text-sm text-[#ead7a3]">
                Arise and Ascend
              </span>
            </span>
          </Link>
          <p className="mt-5 max-w-sm text-sm leading-6 text-white/70">
            Learning, character and opportunity across Preschool, Primary and Secondary.
          </p>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase text-[#ead7a3]">Explore</h2>
          <ul className="mt-3 grid grid-cols-2 gap-x-4">
            {primaryLinks.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={navLinkClass}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase text-[#ead7a3]">Learning communities</h2>
          <ul className="mt-3">
            {learningCommunities.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={navLinkClass}>
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/school/admissions" className={navLinkClass}>
                Admissions
              </Link>
            </li>
            {portal && (
              <li>
                <Link href={portal.href} className={`${navLinkClass} text-white`}>
                  {portal.label}
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/20">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-2 px-5 py-4 text-xs text-white/65 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-12">
          <p>© {new Date().getFullYear()} Greenfield Schools</p>
          <p>Arise and Ascend</p>
        </div>
      </div>
    </footer>
  );
}
