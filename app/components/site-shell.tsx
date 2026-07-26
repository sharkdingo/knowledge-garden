import Link from "next/link";
import { contentServices } from "../composition/content";
import { ExperienceLayer } from "./experience-layer";
import { SiteHeader } from "./site-header";
import { NavigationExperience } from "./navigation-experience";

export async function SiteShell({
  active,
  children,
}: {
  active: "home" | "writing" | "algorithms" | "projects" | "about" | "explore" | "play";
  children: React.ReactNode;
}) {
  const [profile, searchIndex] = await Promise.all([
    contentServices.site.getProfile(),
    contentServices.discovery.buildSearchIndex(),
  ]);
  return (
    <div className="site-root">
      <NavigationExperience />
      <a className="skip-link" href="#main-content">
        跳到主要内容
      </a>
      <SiteHeader
        active={active}
        immersive={active === "home"}
        identity={profile.identity}
        navigation={profile.navigation}
        searchIndex={searchIndex}
      />
      {children}
      <footer className="site-footer">
        <div className="footer-inner">
          <p>{profile.footer.statement}</p>
          <nav aria-label="页脚导航">
            {profile.footer.links.map((link) => (
              <Link href={link.href} key={link.id}>{link.label}</Link>
            ))}
          </nav>
        </div>
      </footer>
      <ExperienceLayer easterEggs={profile.easterEggs} />
    </div>
  );
}
