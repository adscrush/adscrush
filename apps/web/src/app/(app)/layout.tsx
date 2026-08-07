import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="dark relative min-h-screen overflow-x-clip bg-background text-foreground">
            <img
                src="/fixed-overlay.png"
                alt=""
                aria-hidden="true"
                className="pointer-events-none fixed inset-0 z-50 h-full w-full opacity-25"
            />
            <Header />
            <main className="relative z-10">{children}</main>
            <Footer />
        </div>
    )
}
