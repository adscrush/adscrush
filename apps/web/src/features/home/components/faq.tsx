"use client";

import React from 'react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@adscrush/ui/components/accordion";
import { leftFaq, rightFaq } from '../data';

const sectionClass = "reveal";

const FAQSection = () => {
    return (
        <section id="faq" className="px-6 py-24">
            <div className="mx-auto max-w-6xl">
                <h2 data-reveal className={`${sectionClass} mx-auto max-w-4xl text-center text-4xl font-medium md:text-5xl text-foreground lg:text-5xl leading-normal`}>
                    Everything You Need to Know About
                    <br />
                    Tools, Pricing, and Security
                </h2>

                <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Accordion type="single" defaultValue="left-0" collapsible className="space-y-4 border-0 bg-transparent shadow-none">
                        {leftFaq.map((item, idx) => (
                            <AccordionItem
                                key={item.q}
                                value={`left-${idx}`}
                                data-reveal
                                className={`${sectionClass} overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,hsl(220_10%_10%/0.96)_0%,hsl(220_8%_8%/0.98)_100%)] px-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]`}
                            >
                                <AccordionTrigger className="px-1 py-5 text-left text-base font-medium text-foreground hover:no-underline">
                                    {item.q}
                                </AccordionTrigger>
                                <AccordionContent className="border-t border-white/8 px-1 pt-4 text-sm leading-8 text-foreground/60">
                                    {item.a}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>

                    <Accordion type="single" collapsible className="space-y-4 border-0 bg-transparent shadow-none">
                        {rightFaq.map((item, idx) => (
                            <AccordionItem
                                key={item.q}
                                value={`right-${idx}`}
                                data-reveal
                                className={`${sectionClass} overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,hsl(220_10%_10%/0.96)_0%,hsl(220_8%_8%/0.98)_100%)] px-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]`}
                            >
                                <AccordionTrigger className="px-1 py-5 text-left text-base font-medium text-foreground hover:no-underline">
                                    {item.q}
                                </AccordionTrigger>
                                <AccordionContent className="border-t border-white/8 px-1 pt-4 text-sm leading-8 text-foreground/60">
                                    {item.a}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </div>
        </section>
    )
}

export default FAQSection;
