"use client";

import React from 'react';
import { testimonials } from '../data';

const sectionClass = "reveal";

const TestimonialSection = () => {
    return (
        <section id="testimonials" className="relative overflow-hidden px-6 py-24">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background to-transparent z-10" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background to-transparent z-10" />
            <div className="mx-auto max-w-6xl">
                <h2 data-reveal className={`${sectionClass} text-center text-4xl font-medium md:text-5xl text-foreground`}>
                    Trusted by teams that live in performance data
                </h2>
                <div className="relative mt-12 rounded-3xl bg-[radial-gradient(ellipse_80%_70%_at_center,transparent_30%,hsl(var(--background))_100%)]">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                        {testimonials.map((item, idx) => (
                            <article
                                key={item.handle}
                                data-reveal
                                className={`${sectionClass} home-card-surface rounded-2xl border border-border/10 p-4 transition-all hover:border-primary/20 hover:bg-muted/20`}
                                style={{ transitionDelay: `${(idx % 5) * 80}ms` }}
                            >
                                <div className="mb-3 flex items-center gap-2">
                                    <img
                                        loading="lazy"
                                        className="h-8 w-8 rounded-full border border-border/15 bg-background"
                                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.seed}`}
                                        alt={item.handle}
                                    />
                                    <p className="text-xs text-foreground/70">{item.handle}</p>
                                </div>
                                <p className="text-sm text-foreground/75 leading-relaxed">{item.text}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}

export default TestimonialSection;
