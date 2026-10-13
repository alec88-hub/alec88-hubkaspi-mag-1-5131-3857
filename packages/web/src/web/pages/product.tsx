import { useState, useEffect } from "react";
import { Link, useParams } from "wouter";
import {
  ArrowUpRight,
  Plus,
  Minus,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Check,
} from "lucide-react";
import { useCatalog, useReviews } from "../queries/catalog";
import {
  Loading,
  ErrorState,
  ProductCard,
  shortName,
  price,
  colorHex,
  SectionTitle,
} from "../components/store";
function Reviews({ id }: { id: string }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useReviews(id, page);
  return (
    <div className="reviews">
      <div>
        <span className="eyebrow">ОПЫТ ПОКУПАТЕЛЕЙ</span>
        <h2>Отзывы</h2>
        <p>
          Отзывы импортированы из Kaspi.
          <br />
          Оценки без текста учтены в общем рейтинге.
        </p>
      </div>
      <div>
        {isLoading ? (
          <Loading />
        ) : error ? (
          <p>Не удалось загрузить отзывы.</p>
        ) : (
          <>
            <p className="muted">
              {data?.total} оценок · {data?.textCount} отзывов с текстом
            </p>
            {data?.items.map((r: any) => (
              <article className="review" key={r.id}>
                <div>
                  <b>{r.author}</b>
                  <span>{"★".repeat(Number(r.rating))}</span>
                  <time>{new Date(r.date.replace(" ", "T")).toLocaleDateString("ru-RU")}</time>
                </div>
                <p>{r.text}</p>
                <small>{r.source}</small>
              </article>
            ))}
            {(data?.textCount || 0) > 6 && (
              <div className="review-pagination">
                <button disabled={page === 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft size={17} />
                  Назад
                </button>
                <span>
                  {page} / {Math.ceil((data?.textCount || 0) / 6)}
                </span>
                <button
                  disabled={page * 6 >= (data?.textCount || 0)}
                  onClick={() => setPage(page + 1)}
                >
                  Далее
                  <ChevronRight size={17} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
export default function Product() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, error } = useCatalog();
  const p = data?.products.find((p: any) => p.slug === slug);
  const [active, setActive] = useState(0),
    [color, setColor] = useState(""),
    [size, setSize] = useState(""),
    [zoom, setZoom] = useState(false),
    [expanded, setExpanded] = useState("description");
  useEffect(() => {
    setActive(0);
    setColor("");
    setSize("");
    if (p) {
      const ids = JSON.parse(localStorage.getItem("infinie-recent") || "[]");
      localStorage.setItem(
        "infinie-recent",
        JSON.stringify([p.id, ...ids.filter((i: string) => i !== p.id)].slice(0, 5)),
      );
    }
  }, [slug, p]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoom(false);
      if (zoom && p?.images?.length) {
        if (e.key === "ArrowRight") setActive((a) => (a + 1) % p.images.length);
        if (e.key === "ArrowLeft") setActive((a) => (a + p.images.length - 1) % p.images.length);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [zoom, p]);
  if (isLoading) return <Loading />;
  if (error || !data) return <ErrorState />;
  if (!p)
    return (
      <div className="empty">
        <h1>Товар не найден</h1>
        <Link href="/catalog">Вернуться в каталог</Link>
      </div>
    );
  const selectedColor = color || p.links?.[0]?.color || "";
  const variants = p.variants.filter((v: any) => v.color === selectedColor);
  const selected = variants.find((v: any) => v.size === size) || variants[0];
  const url = p.links.find((l: any) => l.color === selectedColor)?.url;
  const im = p.images[active];
  const shownPrice = selected?.price ?? p.price;
  function changeColor(c: string) {
    setColor(c);
    setSize("");
    const v = p.variants.find((v: any) => v.color === c);
    const index = p.images.findIndex((m: any) => m.id === v?.image);
    if (index >= 0) setActive(index);
  }
  return (
    <main className="product-page">
      <div className="breadcrumbs">
        <Link href="/">Главная</Link>
        <span>/</span>
        <Link href="/catalog">Коллекция</Link>
        <span>/</span>
        <span>{shortName(p)}</span>
      </div>
      <div className="product-layout">
        <div className="gallery">
          <div className="main-image">
            <button aria-label="Увеличить фотографию" onClick={() => setZoom(true)}>
              <img
                src={im?.url || "/images/fallback.svg"}
                alt={im?.alt || p.name}
                fetchPriority="high"
              />
              <Maximize2 size={19} />
            </button>
            <span className="gallery-count">
              {active + 1} / {p.images.length}
            </span>
          </div>
          <div className="thumbnails">
            {p.images.map((m: any, i: number) => (
              <button
                key={m.id}
                className={active === i ? "active" : ""}
                onClick={() => setActive(i)}
                aria-label={"Фотография " + (i + 1)}
              >
                <img src={m.thumb || m.url} alt={m.alt || p.name} />
              </button>
            ))}
          </div>
        </div>
        <div className="product-info">
          <span className="eyebrow">
            INFINIE SP / {p.categories.includes("zhenskie") ? "ДЛЯ НЕЁ" : "ДЛЯ НЕГО"}
          </span>
          <h1>{shortName(p)}</h1>
          <a href="#reviews" className="rating">
            ★ {p.rating?.toFixed(2)} <span>{p.reviewCount} оценок · Kaspi</span>
          </a>
          <div className="product-price">{price({ price: shownPrice })}</div>
          <p className="price-date">Подтверждено 12.10.2026 · актуальная цена на Kaspi</p>
          <p className="product-summary">{p.short_description}</p>
          <div className="variant-section">
            <div className="variant-label">
              Цвет <span>{selectedColor}</span>
            </div>
            <div className="color-options">
              {p.links.map((l: any) => (
                <button
                  key={l.color}
                  aria-label={l.color}
                  title={l.color}
                  className={selectedColor === l.color ? "active" : ""}
                  onClick={() => changeColor(l.color)}
                  style={{ background: colorHex(l.color) }}
                >
                  {selectedColor === l.color && (
                    <Check
                      size={15}
                      color={l.color === "Черный" || l.color === "Темно-синий" ? "white" : "#333"}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className="variant-section">
            <div className="variant-label">
              Размер <span>Выберите свой</span>
            </div>
            <div className="size-options">
              {[...new Set(variants.map((v: any) => v.size))].map((s: any) => (
                <button key={s} className={size === s ? "active" : ""} onClick={() => setSize(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          {url ? (
            <a
              href={url}
              className="button kaspi-button"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent("infinie:kaspi", {
                    detail: { id: p.id, category: p.categories[0] },
                  }),
                )
              }
            >
              Купить на Kaspi <ArrowUpRight size={20} />
            </a>
          ) : (
            <button disabled className="button">
              Ссылка требует проверки
            </button>
          )}
          <p className="kaspi-note">
            Вы перейдёте к выбранному цвету товара на Kaspi.
            <br />
            Размер, окончательная цена и оформление — на стороне Kaspi.
          </p>
          {[
            { key: "description", title: "Описание", content: p.description },
            { key: "attributes", title: "Характеристики", content: null },
            {
              key: "purchase",
              title: "Покупка и условия",
              content:
                "Оформление заказа, оплата и условия доставки доступны на странице товара в Kaspi Магазине. Сайт INFINIE SP не принимает платежи.",
            },
          ].map((s) => (
            <section className="accordion" key={s.key}>
              <button
                onClick={() => setExpanded(expanded === s.key ? "" : s.key)}
                aria-expanded={expanded === s.key}
              >
                {s.title}
                {expanded === s.key ? <Minus size={17} /> : <Plus size={17} />}
              </button>
              {expanded === s.key &&
                (s.key === "attributes" ? (
                  <dl>
                    <div>
                      <dt>Артикул</dt>
                      <dd>{p.sku}</dd>
                    </div>
                    {p.attributes.map((a: any) => (
                      <div key={a.name}>
                        <dt>{a.name}</dt>
                        <dd>{a.values.map((v: any) => v.name).join(", ")}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p>{s.content}</p>
                ))}
            </section>
          ))}
        </div>
      </div>
      <div id="reviews">
        <Reviews id={p.id} />
      </div>
      <section className="section related">
        <SectionTitle
          label="В ТОМ ЖЕ НАСТРОЕНИИ"
          title="Дополните свою коллекцию"
          link="/catalog"
        />
        <div className="product-grid">
          {data.products
            .filter(
              (v: any) =>
                v.id !== p.id && v.categories.some((c: string) => p.categories.includes(c)),
            )
            .slice(0, 4)
            .map((v: any) => (
              <ProductCard key={v.id} p={v} />
            ))}
        </div>
      </section>
      {zoom && (
        <dialog open className="lightbox" aria-modal="true" aria-label="Фотография товара">
          <button className="zoom-close" onClick={() => setZoom(false)} aria-label="Закрыть">
            <X />
          </button>
          <button
            onClick={() => setActive((active + p.images.length - 1) % p.images.length)}
            aria-label="Предыдущая фотография"
          >
            <ChevronLeft />
          </button>
          <img src={im?.url} alt={im?.alt || p.name} />
          <button
            onClick={() => setActive((active + 1) % p.images.length)}
            aria-label="Следующая фотография"
          >
            <ChevronRight />
          </button>
        </dialog>
      )}
    </main>
  );
}
