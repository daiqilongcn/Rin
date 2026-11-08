import { useEffect, useState, type ReactNode } from "react";
import { Helmet } from "react-helmet";
import type { ConfigWrapper } from "@rin/config";
import type { Profile } from "../state/profile";
import { ClientConfigContext } from "../state/config";
import { ProfileContext } from "../state/profile";

export function AppProviders({
  children,
  config,
  profile,
}: {
  children: ReactNode;
  config: ConfigWrapper;
  profile: Profile | undefined | null;
}) {
  const [favicon, setFavicon] = useState("/logo.svg");
  useEffect(() => {
    // The favicon service lives under /api on Pages deployments. Probe it as
    // an image so HTML fallbacks, missing storage and network errors retain the logo.
    let active = true;
    const image = new Image();
    image.onload = () => { if (active) setFavicon("/api/favicon"); };
    image.src = "/api/favicon";
    return () => { active = false; image.onload = null; };
  }, []);

  return (
    <ClientConfigContext.Provider value={config}>
      <ProfileContext.Provider value={profile}>
        <Helmet>
          <link rel="icon" href={favicon} />
        </Helmet>
        {children}
      </ProfileContext.Provider>
    </ClientConfigContext.Provider>
  );
}
