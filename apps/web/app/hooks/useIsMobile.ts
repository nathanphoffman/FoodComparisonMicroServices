import { useState, useEffect } from "react";

// Matches Tailwind's `md` breakpoint (768px) — below it counts as mobile.
const MOBILE_QUERY = "(max-width: 767px)";

// Returns false on the server and first render so hydration matches, then
// updates to the real value after mount and on resize.

export function useIsMobile(): boolean {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const media = window.matchMedia(MOBILE_QUERY);
        setIsMobile(media.matches);
        const onChange = (event: MediaQueryListEvent) => setIsMobile(event.matches);
        media.addEventListener("change", onChange);
        return () => media.removeEventListener("change", onChange);
    }, []);

    return isMobile;
}
