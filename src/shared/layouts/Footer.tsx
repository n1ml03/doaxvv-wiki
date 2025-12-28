import { useTranslation } from "@/shared/hooks/useTranslation";

/**
 * Footer component with ARIA contentinfo landmark
 * Provides site-wide footer information and copyright
 */
export function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer
      role="contentinfo"
      className="relative border-t border-border/30 bg-background/80 backdrop-blur-sm py-8 mt-auto overflow-hidden"
    >
      {/* Subtle gradient decoration */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/3 via-transparent to-transparent pointer-events-none" />
      
      <div className="container mx-auto px-4 text-center relative">
        <div className="flex flex-col items-center gap-3">
          {/* Logo/Brand */}
          <div className="flex items-center gap-2 mb-2">
            <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <img src="/favicon.ico" alt="Logo" className="h-4 w-4" />
            </div>
            <span className="font-semibold text-foreground">{t('app.title')}</span>
          </div>
          
          <p className="text-sm text-muted-foreground">
            © {currentYear} {t('app.title')}. {t('footer.rights')}
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
