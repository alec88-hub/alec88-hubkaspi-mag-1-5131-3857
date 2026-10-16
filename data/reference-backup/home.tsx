import { Link } from "wouter";
import { ArrowUpRight, ArrowRight, Leaf, ExternalLink, Layers } from "lucide-react";
import { useCatalog } from "../queries/catalog";
import { Loading, ErrorState, ProductCard, SectionTitle } from "../components/store";
export default function Home() {
  const { data, isLoading, error } = useCatalog();
  if (isLoading) return <Loading />;
  if (error || !data) return <ErrorState />;
  const { products, settings } = data;
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <i /> {settings.heroEyebrow}
          </span>
          <h1>
            {settings.heroTitle?.split("\n").map((t: string, i: number) => (
              <span key={i}>{t}</span>
            ))}
          </h1>
          <p>{settings.heroText}</p>
          <Link href="/catalog" className="button">
            Открыть коллекцию <ArrowUpRight size={18} />
          </Link>
          <div className="hero-bottom">
            <span>ESSENTIALS BY INFINIE SP</span>
            <span>01 / 07</span>
          </div>
        </div>
        <div className="hero-photo">
          <img
            src={settings.heroImage || "/images/M001.webp"}
            alt="INFINIE SP — женская чёрная футболка оверсайз"
            fetchPriority="high"
          />
          <div className="hero-photo-caption">
            <span>СВОБОДА БЫТЬ СОБОЙ</span>
            <Link href="/product/infinie-sp-oversize-tshirt" aria-label="Женская футболка оверсайз">
              <ArrowUpRight size={23} />
            </Link>
          </div>
        </div>
        <div className="hero-side">TIMELESS PIECES. EVERYDAY CONFIDENCE.</div>
      </section>
      <div className="brand-strip">
        <span>ЧИСТЫЕ ЛИНИИ</span>
        <i />
        <span>СВОБОДНЫЙ СИЛУЭТ</span>
        <i />
        <span>НАТУРАЛЬНЫЙ ХЛОПОК</span>
        <i />
        <span>INFINIE SP</span>
      </div>
      <section className="section">
        <SectionTitle label="ВЫБРАНО ДЛЯ ВАС" title="Основа вашего гардероба" link="/catalog" />
        <div className="product-grid">
          {products
            .filter((p: any) => p.featured)
            .slice(0, 4)
            .map((p: any) => (
              <ProductCard key={p.id} p={p} />
            ))}
        </div>
        <p className="price-disclaimer">
          Цены из каталога подтверждены 12.10.2026. Актуальная стоимость — на Kaspi.
        </p>
      </section>
      <section className="categories-section">
        <SectionTitle label="ДВА ВЗГЛЯДА. ОДНА ФИЛОСОФИЯ." title="Найдите своё" />
        <div className="category-grid">
          <Link href="/category/zhenskie" className="category-panel">
            <img src="/images/M016.webp" alt="Женская коллекция INFINIE SP" loading="lazy" />
            <div>
              <span className="eyebrow">ДЛЯ НЕЁ</span>
              <h3>Женская коллекция</h3>
              <span className="category-arrow">
                <ArrowUpRight size={26} />
              </span>
            </div>
          </Link>
          <Link href="/category/muzhskie" className="category-panel">
            <img src="/images/M029.webp" alt="Мужская коллекция INFINIE SP" loading="lazy" />
            <div>
              <span className="eyebrow">ДЛЯ НЕГО</span>
              <h3>Мужская коллекция</h3>
              <span className="category-arrow">
                <ArrowUpRight size={26} />
              </span>
            </div>
          </Link>
        </div>
      </section>
      <section className="editorial">
        <div className="editorial-image">
          <img src="/images/M039.webp" loading="lazy" alt="Розовая футболка INFINIE SP" />
        </div>
        <div className="editorial-copy">
          <span className="eyebrow">ФИЛОСОФИЯ INFINIE SP</span>
          <h2>
            Не просто вещи.
            <br />
            <em>Ваше состояние.</em>
          </h2>
          <p>{settings.about}</p>
          <Link href="/about" className="text-link">
            Познакомиться с брендом <ArrowRight size={18} />
          </Link>
        </div>
      </section>
      <section className="section">
        <SectionTitle
          label="ВЫБОР ПОКУПАТЕЛЕЙ · ПО ЧИСЛУ ОТЗЫВОВ"
          title="Вещи, к которым возвращаются"
          link="/catalog?sort=popular"
        />
        <div className="product-grid">
          {[...products]
            .sort((a: any, b: any) => b.reviewCount - a.reviewCount)
            .slice(0, 4)
            .map((p: any) => (
              <ProductCard key={p.id} p={p} />
            ))}
        </div>
      </section>
      <section className="benefits">
        <div>
          <Leaf size={24} />
          <h3>Материал имеет значение</h3>
          <p>
            Состав и характеристики —<br />в каждой карточке товара.
          </p>
        </div>
        <div>
          <Layers size={24} />
          <h3>Ваш силуэт, ваш выбор</h3>
          <p>
            Реальные фотографии,
            <br />
            цвета и размерные варианты.
          </p>
        </div>
        <div>
          <ExternalLink size={24} />
          <h3>Покупка на Kaspi</h3>
          <p>
            Оформление и оплата —<br />в привычном маркетплейсе.
          </p>
        </div>
      </section>
    </>
  );
}
