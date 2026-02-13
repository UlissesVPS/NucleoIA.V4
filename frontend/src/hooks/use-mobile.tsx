import * as React from "react";

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}

export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState(false);

  React.useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      setIsTablet(w >= MOBILE_BREAKPOINT && w < TABLET_BREAKPOINT);
    };
    const mql = window.matchMedia(`(min-width: ${MOBILE_BREAKPOINT}px) and (max-width: ${TABLET_BREAKPOINT - 1}px)`);
    mql.addEventListener("change", check);
    check();
    return () => mql.removeEventListener("change", check);
  }, []);

  return isTablet;
}

export function useBreakpoint() {
  const [bp, setBp] = React.useState<"xs" | "sm" | "md" | "lg" | "xl" | "2xl">("md");

  React.useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      if (w < 640) setBp("xs");
      else if (w < 768) setBp("sm");
      else if (w < 1024) setBp("md");
      else if (w < 1280) setBp("lg");
      else if (w < 1536) setBp("xl");
      else setBp("2xl");
    };
    window.addEventListener("resize", check);
    check();
    return () => window.removeEventListener("resize", check);
  }, []);

  return bp;
}
