import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteShell } from "../components/site-shell";
import { contentServices } from "../composition/content";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { about } = await contentServices.site.getProfile();
  return {
    title: about.intro.title,
    description: `${about.name} · ${about.role}`,
  };
}

export default async function AboutPage() {
  const { about } = await contentServices.site.getProfile();
  return (
    <SiteShell active="about">
      <main id="main-content" className="page-shell about-page">
        <header className="page-intro compact-intro">
          <p className="eyebrow">{about.intro.eyebrow}</p>
          <h1>{about.intro.title}</h1>
          <p>{about.intro.description}</p>
        </header>
        <div className="about-layout">
          <section className="profile-panel" aria-labelledby="profile-name">
            <Image src={about.image.src} alt={about.image.alt} width={300} height={300} priority />
            <h2 id="profile-name">{about.name}</h2>
            <p className="profile-role">{about.role}</p>
            <p>{about.bio}</p>
            <blockquote>{about.quote}</blockquote>
            <p className="profile-location">◎ {about.location}</p>
            <div id="contact" className="social-links">
              {about.socials.map((link) => (
                <Link href={link.href} key={link.href}>{link.label}</Link>
              ))}
            </div>
          </section>

          <div className="about-details">
            <section className="journey-panel" aria-labelledby="journey-title">
              <h2 id="journey-title">Journey / 经历</h2>
              <ol>
                {about.journey.map((item) => (
                  <li key={`${item.title}-${item.period}`}>
                    <i aria-hidden="true" /><div><h3>{item.title}</h3><p>{item.description}</p></div><time>{item.period}</time>
                  </li>
                ))}
              </ol>
            </section>
            <section className="skills-panel" aria-label="技能与兴趣">
              {about.skills.map(({ group, items }) => (
                <div key={group}>
                  <h2>{group}</h2>
                  <p>{items.map((item) => <span key={item}>{item}</span>)}</p>
                </div>
              ))}
            </section>
            <section className="now-panel">
              <h2>Now / 近期</h2>
              {about.now.map((item) => <p key={item}>→ {item}</p>)}
            </section>
          </div>
        </div>
        <section className="values-panel" aria-labelledby="values-title">
          <h2 id="values-title">Values / 我在意的</h2>
          <div>
            {about.values.map((value) => (
              <article key={value.title}>
                <i aria-hidden="true">{value.symbol}</i>
                <h3>{value.title}</h3>
                <p>{value.description}</p>
                <small>{value.note}</small>
              </article>
            ))}
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
