import { useEffect } from 'react';

/**
 * Escape closes; the page behind doesn't scroll while the modal is open.
 * The body is padded by the scrollbar's width so hiding the scrollbar doesn't change
 * the page width, which would force the browser to re-layout the whole food table.
 */
export function useModalLock(onClose: () => void) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const { overflow: previousOverflow, paddingRight: previousPadding } = document.body.style;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPadding;
    };
  }, [onClose]);
}
