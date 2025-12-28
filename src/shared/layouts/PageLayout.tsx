import React from "react";
import Header from "./Header";
import { Footer } from "./Footer";
import Breadcrumb, { type BreadcrumbItem } from "@/shared/components/Breadcrumb";
import { cn } from "@/lib/utils";

interface PageLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  title?: string;
  description?: string;
  className?: string;
  showFooter?: boolean;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  breadcrumbs,
  title,
  description,
  className,
  showFooter = true,
}) => {
  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* Subtle background decoration - optimized with will-change */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/[0.03] blur-3xl will-change-transform" />
        <div className="absolute top-1/3 -left-32 w-64 h-64 rounded-full bg-secondary/[0.03] blur-3xl will-change-transform" />
      </div>
      
      <Header />
      <main id="main-content" role="main" className={cn("container mx-auto px-4 py-8 flex-1 relative", className)}>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumb items={breadcrumbs} />
        )}
        {(title || description) && (
          <div className="mb-8">
            {title && (
              <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
                {title}
              </h1>
            )}
            {description && (
              <p className="text-muted-foreground text-lg">
                {description}
              </p>
            )}
          </div>
        )}
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  );
};

export default PageLayout;
