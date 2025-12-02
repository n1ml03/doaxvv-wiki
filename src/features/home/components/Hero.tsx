import heroBeach from "@/assets/hero-beach.jpg";
import { HeroSearch } from "@/features/search";
import { useTranslation } from "@/shared/hooks/useTranslation";

const Hero = () => {
  const { t } = useTranslation();
  return (
    <section className="relative z-20 mx-4 md:mx-8 mt-8 shadow-card rounded-3xl">
      <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
        <img 
          src={heroBeach} 
          alt={t('hero.altText')} 
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-hero" />
      </div>
      
      <div className="relative h-[400px] md:h-[500px] flex items-center justify-center">
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto animate-fade-in">
          <p className="text-2xl md:text-3xl lg:text-4xl text-white/95 mb-3 drop-shadow-lg font-semibold tracking-wide">
            {t('hero.welcomeTo')}
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 drop-shadow-lg">
            {t('hero.title')}
          </h1>
          <p className="text-lg md:text-xl text-white/95 mb-8 drop-shadow">
            {t('hero.subtitle')}
          </p>
          
          <HeroSearch placeholder={t('hero.searchPlaceholder')} />
        </div>
      </div>
    </section>
  );
};

export default Hero;
