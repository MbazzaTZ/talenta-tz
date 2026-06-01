import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";


import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth";
import { LangProvider } from "@/lib/i18n";
import { Toaster } from "@/components/ui/sonner";
import { SupabaseMissingBanner } from "@/components/supabase-missing-banner";
import { AIChatPanel } from "@/components/ai-chat-panel";
import { TooltipProvider } from "@/components/ui/tooltip";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-display font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Talentra — Connecting Talent to Opportunity" },
      {
        name: "description",
        content:
          "Tanzania's smarter job network. Browse thousands of jobs in tourism, ICT, finance, healthcare, agriculture and more — in English & Kiswahili.",
      },
      { property: "og:title", content: "Talentra" },
      {
        property: "og:description",
        content: "Connecting employers and job seekers across Tanzania.",
      },
      { property: "og:type", content: "website" },
      { title: "Talentra" },
      { property: "og:title", content: "Talentra" },
      { name: "twitter:title", content: "Talentra" },
      {
        name: "description",
        content:
          "Talent Showcase is a web application for showcasing and discovering creative projects and portfolios.",
      },
      {
        property: "og:description",
        content:
          "Talent Showcase is a web application for showcasing and discovering creative projects and portfolios.",
      },
      {
        name: "twitter:description",
        content:
          "Talent Showcase is a web application for showcasing and discovering creative projects and portfolios.",
      },
      {
        property: "og:image",
        content:
          "https://storage.googleapis.com/gpt-engineer-file-uploads/SiyQYghE1EZv61H1ooyrHaZaN8t1/social-images/social-1779899247526-Logo.webp",
      },
      {
        name: "twitter:image",
        content:
          "https://storage.googleapis.com/gpt-engineer-file-uploads/SiyQYghE1EZv61H1ooyrHaZaN8t1/social-images/social-1779899247526-Logo.webp",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/Logo.png" },
      { rel: "apple-touch-icon", href: "/Logo.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  // Warm the jobs cache as soon as the app boots so /jobs renders instantly.
  useEffect(() => {
    const emptySearch = {
      q: undefined,
      region: undefined,
      industry: undefined,
      level: undefined,
      contract: undefined,
      qualification: undefined,
      salary: undefined,
    };
    queryClient.prefetchQuery({
      queryKey: ["jobs", emptySearch, 1],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("jobs")
          .select(
            "id,title,location,region,industry,contract_type,salary_min,salary_max,salary_negotiable,currency,created_at,deadline,featured,companies(name,logo_url,verified)",
          )
          .eq("status", "published")
          .order("featured", { ascending: false })
          .order("created_at", { ascending: false })
          .range(0, 19);
        if (error) throw error;
        return data ?? [];
      },
      staleTime: 60_000,
    });
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>

      <LangProvider>
        <AuthProvider>
          <TooltipProvider>
            <SupabaseMissingBanner />
            <Outlet />
            <AIChatPanel />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </LangProvider>
    </QueryClientProvider>
  );
}
