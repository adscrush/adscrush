"use client";

import React from 'react';
import { bentoCards } from '../data';

const sectionClass = "reveal";

const FeaturesSection = () => {
  return (
    <section className="px-6 py-24" id="platform">
      <div className="mx-auto max-w-[1100px] text-center">
        <h2 data-reveal className={`${sectionClass} text-4xl font-medium md:text-5xl`}>
          The operating layer for modern attribution teams
        </h2>
        <p data-reveal className={`${sectionClass} mx-auto mt-4 max-w-xl text-foreground/60`}>
          Adscrush turns tracking, monitoring, partner oversight, and reporting into one readable workflow for the whole team.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-[1100px] grid-cols-1 gap-4 md:grid-cols-3">
        <article data-reveal className={`${sectionClass} gradient-card relative row-span-2 overflow-hidden rounded-2xl border border-border/10 pt-8 inset-glow`}>
          <div className="px-8">
            <h3 className="max-w-xs text-xl font-medium text-foreground">Unified performance overview</h3>
            <p className="mt-2 max-w-xs text-sm text-foreground/60">Monitor clicks, conversions, offer health, and attributed revenue in one streamlined operator panel.</p>
          </div>
          <div className="relative mt-8 overflow-hidden rounded-tl-3xl border border-border/10 bg-background/40">
            <img
              src="/bento-1.png"
              alt="Unified Adscrush performance overview"
              loading="lazy"
              className="block h-auto w-full object-cover"
            />
          </div>
        </article>

        {bentoCards.map((card, idx) => (
          <article
            key={card.title}
            data-reveal
            className={`${sectionClass} home-card-surface rounded-2xl border border-border/10 p-6 inset-glow flex flex-col`}
            style={{ transitionDelay: `${(idx + 1) * 100}ms` }}
          >
            <div className="overflow-hidden rounded-2xl border border-border/10 h-44 mb-6 bg-background/40 shadow-inner">
              <img
                src={card.image}
                alt={card.title}
                loading="lazy"
                className="h-full w-full object-cover transition-transform hover:scale-105 duration-500"
              />
            </div>
            <div className="mt-auto">
              <h3 className="text-lg font-medium text-foreground">{card.title}</h3>
              <p className="mt-2 text-sm text-foreground/60">{card.description || "Receive actionable context with precision visuals and resilient data syncing."}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default FeaturesSection;
