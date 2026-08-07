"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function RevealEffect() {
  const pathname = usePathname();

  useEffect(() => {
    // Small delay to ensure React has painted the initial content
    const timeoutId = setTimeout(() => {
      const observerOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px",
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-visible");
            // Optional: unobserve once revealed to save resources
            // observer.unobserve(entry.target);
          }
        });
      }, observerOptions);

      const elements = document.querySelectorAll("[data-reveal]");
      elements.forEach((el) => observer.observe(el));

      // Also watch for newly added elements (DOM mutations)
      const mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement) {
              if (node.hasAttribute("data-reveal")) {
                observer.observe(node);
              }
              const children = node.querySelectorAll("[data-reveal]");
              children.forEach((el) => observer.observe(el));
            }
          });
        });
      });

      mutationObserver.observe(document.body, { childList: true, subtree: true });

      return () => {
        observer.disconnect();
        mutationObserver.disconnect();
      };
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [pathname]); // Re-run on route switch

  return null;
}
