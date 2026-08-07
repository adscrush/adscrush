import { Button } from "@adscrush/ui/components/button";
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyTitle,
} from "@adscrush/ui/components/empty";
import { IconHome, IconCompass } from "@tabler/icons-react";

export function NotFoundPage() {
    return (
        <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden">
            <Empty>
                <EmptyHeader>
                    <EmptyTitle className="mask-b-from-20% mask-b-to-80% font-extrabold text-9xl">
                        404
                    </EmptyTitle>
                    <EmptyDescription className="-mt-8 text-nowrap text-foreground/80">
                        The page you&apos;re looking for might have been <br />
                        moved or doesn&apos;t exist.
                    </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                    <div className="flex gap-2">
                        <Button asChild>
                            <a href="#">
                                <IconHome data-icon="inline-start" />
                                Go Home
                            </a>
                        </Button>

                        <Button asChild variant="outline">
                            <a href="#">
                                <IconCompass data-icon="inline-start" />{" "}
                                Explore
                            </a>
                        </Button>
                    </div>
                </EmptyContent>
            </Empty>
        </div>
    );
}
