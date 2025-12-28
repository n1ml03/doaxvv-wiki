import heroBeach from "@/assets/hero-beach.jpg";
import { PrismCapsuleSearch } from "@/features/search/components/PrismCapsuleSearch";
import { useTranslation } from "@/shared/hooks/useTranslation";

const Hero = () => {
  const { t } = useTranslation();
  return (
    <section className="relative z-20 mx-4 md:mx-8 mt-8">
      {/* Background container with overflow-hidden for rounded corners */}
      <div className="absolute inset-0 rounded-3xl overflow-hidden shadow-card pointer-events-none">
        <img 
          src={heroBeach} 
          alt={t('hero.altText')} 
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-hero" />
      </div>
      
      <div className="relative h-[400px] md:h-[500px] flex items-center justify-center rounded-3xl">
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto animate-fade-in">
          <p className="text-2xl md:text-3xl lg:text-4xl text-white/95 mb-3 drop-shadow-lg font-semibold tracking-wide">
            {t('hero.welcomeTo')}
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 drop-shadow-lg">
            {t('hero.title')}
          </h1>
          <p className="text-lg md:text-xl text-white/95 mb-14 drop-shadow">
            {t('hero.subtitle')}
          </p>
          
          <div className="mt-8">
            <PrismCapsuleSearch placeholder={t('hero.searchPlaceholder')} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
