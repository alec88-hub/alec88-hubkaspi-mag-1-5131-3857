import { Link } from "wouter";
import { ArrowUpRight, ArrowRight, Leaf, ExternalLink, Layers } from "lucide-react";
import { useCatalog } from "../queries/catalog";
import { Loading, ErrorState, ProductCard, SectionTitle } from "../components/store";
export default function Home() {
  const { data, isLoading, error } = useCatalog();
  if (isLoading) return <Loading />;
  if (error || !data) return <ErrorState />;
  const { products, settings } = data;
  const cotton = products.find((p: any) => p.id === "P004");
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">{settings.heroEyebrow}</span>
          <h1>
            {settings.heroTitle?.split("\n").map((t: string, i: number) => (
              <span key={i}>{t}</span>
            ))}
          </h1>
          <p className="hero-subtitle">
            Свободно. Уверенно.
            <br />
            <em>На каждый день.</em>
          </p>
          <p>{settings.heroText}</p>
          <div className="hero-actions">
            <Link href="/catalog" className="button">
              Выбрать цвет и размер <ArrowUpRight size={17} />
            </Link>
            <a href="#details" className="text-link">
              Посмотреть детали ↓
            </a>
          </div>
          <dl className="hero-facts">
            <div>
              <dt>100%</dt>
              <dd>хлопок в моделях</dd>
            </div>
            <div>
              <dt>{products.length}</dt>
              <dd>моделей в каталоге</dd>
            </div>
            <div>
              <dt>Kaspi</dt>
              <dd>оформление заказа</dd>
            </div>
          </dl>
        </div>
        <div className="hero-photo">
          <img
            src={settings.heroImage || "/reference/hero-white.jpg"}
            alt="Белая мужская хлопковая футболка INFINIE SP"
            fetchPriority="high"
          />
        </div>
      </section>
      <section className="reference-statement">
        <span className="eyebrow">НАТУРАЛЬНЫЙ ХЛОПОК · ЧИСТЫЙ СИЛУЭТ</span>
        <h2>
          Свободный крой. Спокойные цвета.
          <br />
          <em>Просто ваша футболка.</em>
        </h2>
      </section>
      <section className="section" id="details">
        <SectionTitle label="ДЕТАЛИ" title="Качество начинается с деталей" />
        <p className="section-subtitle">Посмотрите ближе. Выберите осознанно.</p>
        <div className="detail-grid">
          <article>
            <Link href={cotton ? "/product/" + cotton.slug : "/catalog"}>
              <img
                src="/reference/detail-white-neck.jpg"
                alt="Горловина белой мужской футболки INFINIE SP"
                loading="lazy"
              />
            </Link>
            <span className="eyebrow">01 / ГОРЛОВИНА</span>
            <h3>Аккуратная обработка</h3>
            <p>Круглый вырез и крупные фотографии деталей. Всё, что важно увидеть до покупки.</p>
          </article>
          <article>
            <Link href={cotton ? "/product/" + cotton.slug : "/catalog"}>
              <img
                src="/reference/detail-navy-fabric.jpg"
                alt="Фактура тёмно-синего хлопка INFINIE SP"
                loading="lazy"
              />
            </Link>
            <span className="eyebrow">02 / МАТЕРИАЛ</span>
            <h3>Натуральный хлопок</h3>
            <p>
              Состав и плотность указаны в описании каждой модели. Выбирайте то, что подходит вам.
            </p>
          </article>
          <article>
            <Link href="/catalog">
              <img
                src="/reference/detail-3-neck.jpg"
                alt="Деталь чёрной футболки INFINIE SP"
                loading="lazy"
              />
            </Link>
            <span className="eyebrow">03 / ПОСАДКА</span>
            <h3>Прямой крой или оверсайз</h3>
            <p>Разные силуэты для одного гардероба. Размеры и фотографии — в карточке товара.</p>
          </article>
        </div>
      </section>
      <section className="reference-sand">
        <div className="section">
          <SectionTitle label="ВАШ ЦВЕТ, ВАШ РИТМ" title="Начните с базового" link="/catalog" />
          <p className="section-subtitle">
            Начните с белого. <em>Добавьте настроение.</em>
          </p>
          <div className="product-grid">
            {products
              .filter((p: any) => p.featured)
              .slice(0, 4)
              .map((p: any) => (
                <ProductCard key={p.id} p={p} />
              ))}
          </div>
          <p className="price-disclaimer">
            Цены подтверждены 12.10.2026. Актуальная стоимость и наличие — на Kaspi.
          </p>
        </div>
      </section>
      <section className="categories-section">
        <SectionTitle label="ПОСАДКА" title="Для неё. Для него. Для каждого дня." />
        <div className="category-grid">
          <Link href="/category/zhenskie" className="category-panel">
            <img src="/images/M016.webp" alt="Женские футболки INFINIE SP" loading="lazy" />
            <div>
              <span className="eyebrow">ЖЕНСКИЕ ФУТБОЛКИ</span>
              <h3>Свобода в силуэте.</h3>
              <span className="category-arrow">
                <ArrowUpRight size={24} />
              </span>
            </div>
          </Link>
          <Link href="/category/muzhskie" className="category-panel">
            <img
              src="/reference/hero-navy.jpg"
              alt="Мужская тёмно-синяя футболка INFINIE SP"
              loading="lazy"
            />
            <div>
              <span className="eyebrow">МУЖСКИЕ ФУТБОЛКИ</span>
              <h3>Чистая база.</h3>
              <span className="category-arrow">
                <ArrowUpRight size={24} />
              </span>
            </div>
          </Link>
        </div>
      </section>
      <section className="reference-sand">
        <div className="editorial">
          <div className="editorial-image">
            <img
              src="/reference/lifestyle.jpg"
              loading="lazy"
              alt="Повседневный образ INFINIE SP"
            />
          </div>
          <div className="editorial-copy">
            <span className="eyebrow">О БРЕНДЕ</span>
            <h2>
              Хорошая база.
              <br />
              <em>Без лишних деталей.</em>
            </h2>
            <p>{settings.about}</p>
            <Link href="/about" className="text-link">
              Ближе к INFINIE SP <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>
      <section className="section">
        <SectionTitle
          label="ОТЗЫВЫ · ВЫБОР ПО ЧИСЛУ ОЦЕНОК"
          title="Покупатели уже носят"
          link="/catalog?sort=popular"
        />
        <p className="section-subtitle">
          И делятся впечатлениями. <em>Посмотрите их выбор.</em>
        </p>
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
          <h3>Состав — без догадок</h3>
          <p>
            Характеристики каждой модели
            <br />
            указаны в карточке товара.
          </p>
        </div>
        <div>
          <Layers size={24} />
          <h3>Посадка — на ваш выбор</h3>
          <p>
            Фотографии, цвета и размеры.
            <br />
            Посмотрите, прежде чем выбрать.
          </p>
        </div>
        <div>
          <ExternalLink size={24} />
          <h3>Покупка — на Kaspi</h3>
          <p>
            Выберите здесь.
            <br />
            Оформите заказ в маркетплейсе.
          </p>
        </div>
      </section>
      <section className="reference-closing">
        <img src="/reference/hero-white.jpg" alt="Белая футболка INFINIE SP" loading="lazy" />
        <div>
          <span className="eyebrow">INFINIE SP · НА КАЖДЫЙ ДЕНЬ</span>
          <h2>Та самая футболка.</h2>
          <p>
            Натуральный хлопок. Ваш цвет. Ваша посадка.
            <br />
            Чистая база без лишних деталей.
          </p>
          <Link href="/catalog" className="button">
            Найти свою футболку <ArrowUpRight size={17} />
          </Link>
        </div>
      </section>
    </>
  );
}
