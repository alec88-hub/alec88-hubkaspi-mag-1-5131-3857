import { useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { SlidersHorizontal, Search, X } from "lucide-react";
import { useCatalog } from "../queries/catalog";
import { Loading, ErrorState, ProductCard } from "../components/store";
export default function Catalog() {
  const { data, isLoading, error } = useCatalog();
  const params = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const sp = new URLSearchParams(window.location.search);
  const [open, setOpen] = useState(false);
  const [limit, setLimit] = useState(12);
  if (isLoading) return <Loading />;
  if (error || !data) return <ErrorState />;
  const category = params.slug || sp.get("category") || "";
  const q = sp.get("q") || "",
    color = sp.get("color") || "",
    size = sp.get("size") || "",
    sort = sp.get("sort") || "default",
    min = sp.get("min") || "",
    max = sp.get("max") || "";
  const favorites = window.location.pathname === "/favorites";
  const saved = JSON.parse(localStorage.getItem("infinie-favorites") || "[]");
  const all = data.products.filter((p: any) => !category || p.categories.includes(category));
  const colors = [...new Set(all.flatMap((p: any) => p.variants.map((v: any) => v.color)))].filter(
    Boolean,
  ) as string[];
  const sizes = [...new Set(all.flatMap((p: any) => p.variants.map((v: any) => v.size)))].filter(
    Boolean,
  ) as string[];
  let ps = all.filter(
    (p: any) =>
      (!favorites || saved.includes(p.id)) &&
      (!q ||
        [p.name, p.sku, p.brand, p.description]
          .join(" ")
          .toLocaleLowerCase()
          .includes(q.toLocaleLowerCase())) &&
      (!color || p.variants.some((v: any) => v.color === color)) &&
      (!size || p.variants.some((v: any) => v.size === size)) &&
      (!min || p.price >= Number(min)) &&
      (!max || p.price <= Number(max)),
  );
  ps = [...ps].sort((a: any, b: any) =>
    sort === "name"
      ? a.name.localeCompare(b.name, "ru")
      : sort === "price-asc"
        ? a.price - b.price
        : sort === "price-desc"
          ? b.price - a.price
          : sort === "popular"
            ? b.reviewCount - a.reviewCount
            : 0,
  );
  function update(k: string, v: string) {
    const n = new URLSearchParams(window.location.search);
    if (v) n.set(k, v);
    else n.delete(k);
    setLimit(12);
    navigate(window.location.pathname + (n.size ? "?" + n : ""));
  }
  const title = favorites
    ? "Избранное"
    : category
      ? data.categories.find((c: any) => c.slug === category)?.name || "Коллекция"
      : "Вся коллекция";
  return (
    <main className="catalog-page">
      <div className="breadcrumbs">
        <Link href="/">Главная</Link>
        <span>/</span>
        <span>{title}</span>
      </div>
      <div className="catalog-title">
        <div>
          <span className="eyebrow">INFINIE SP / ESSENTIALS</span>
          <h1>{title}</h1>
          <p>Продуманные вещи для вашей повседневности.</p>
        </div>
        <span className="catalog-count">{ps.length} товаров</span>
      </div>
      <div className="catalog-toolbar">
        <button className="filter-toggle" onClick={() => setOpen(!open)}>
          <SlidersHorizontal size={17} />
          Фильтры {(color || size || min || max) && <i />}
        </button>
        <div className="category-tabs">
          <Link href="/catalog" className={!category ? "active" : ""}>
            Все
          </Link>
          <Link href="/category/zhenskie" className={category === "zhenskie" ? "active" : ""}>
            Женщинам
          </Link>
          <Link href="/category/muzhskie" className={category === "muzhskie" ? "active" : ""}>
            Мужчинам
          </Link>
        </div>
        <select
          aria-label="Сортировка"
          value={sort}
          onChange={(e) => update("sort", e.target.value)}
        >
          <option value="default">По умолчанию</option>
          <option value="name">По названию</option>
          <option value="price-asc">Цена: по возрастанию</option>
          <option value="price-desc">Цена: по убыванию</option>
          <option value="popular">По числу отзывов</option>
        </select>
      </div>
      {open && (
        <div className="filters">
          <label>
            Поиск
            <input aria-label="Поиск"
              value={q}
              onChange={(e) => update("q", e.target.value)}
              placeholder="Название или артикул"
            />
          </label>
          <label>
            Цвет
            <select value={color} onChange={(e) => update("color", e.target.value)}>
              <option value="">Все цвета</option>
              {colors.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Размер
            <select value={size} onChange={(e) => update("size", e.target.value)}>
              <option value="">Все размеры</option>
              {sizes.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            Цена от, ₸
            <input aria-label="Цена от"
              type="number"
              min="0"
              value={min}
              onChange={(e) => update("min", e.target.value)}
            />
          </label>
          <label>
            Цена до, ₸
            <input aria-label="Цена до"
              type="number"
              min="0"
              value={max}
              onChange={(e) => update("max", e.target.value)}
            />
          </label>
          <button onClick={() => navigate(window.location.pathname)}>
            Сбросить <X size={15} />
          </button>
        </div>
      )}
      {q && (
        <div className="search-result">
          <Search size={16} />
          Поиск: «{q}»{" "}
          <button onClick={() => update("q", "")} aria-label="Сбросить поиск">
            <X size={14} />
          </button>
        </div>
      )}
      {ps.length ? (
        <div className="product-grid">
          {ps.slice(0, limit).map((p: any) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <h2>{favorites ? "Сохраните то, что нравится" : "Ничего не найдено"}</h2>
          <p>
            {favorites
              ? "Нажмите на сердечко в карточке товара."
              : "Попробуйте изменить поиск или фильтры."}
          </p>
          <Link href="/catalog" className="button">
            Вся коллекция
          </Link>
        </div>
      )}
      {limit < ps.length && (
        <button className="button load-more" onClick={() => setLimit(limit + 12)}>
          Показать ещё
        </button>
      )}
      <p className="price-disclaimer">
        Цены подтверждены 12.10.2026. Условия и актуальная стоимость — на Kaspi.
      </p>
    </main>
  );
}
