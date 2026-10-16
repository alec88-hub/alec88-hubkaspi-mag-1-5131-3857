import { BrandLogo } from "./brand-logo";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Search, ArrowUpRight, Menu, X, Heart, ArrowRight } from "lucide-react";
import { useCatalog } from "../queries/catalog";
export function price(p: any) {
  return p.price != null ? new Intl.NumberFormat("ru-KZ").format(p.price) + " ₸" : "Цена на Kaspi";
}
export function shortName(p: any) {
  return p.name.replace(/^INFINIE SP /, "");
}
export function colorHex(c: string) {
  return (
    (
      {
        Черный: "#242421",
        Белый: "#fff",
        Песочный: "#c8b994",
        Розовый: "#e7b3c5",
        "Темно-синий": "#303f52",
        "Серо-голубой": "#a5bbc6",
        Фисташковый: "#d0d6ae",
      } as Record<string, string>
    )[c] || "#ddd"
  );
}
export function Loading() {
  return (
    <div className="loading">
      <span />
      Загружаем коллекцию
    </div>
  );
}
export function ErrorState() {
  return (
    <div className="empty">
      <h2>Не удалось загрузить каталог</h2>
      <p>Проверьте соединение и попробуйте ещё раз.</p>
      <button className="button" onClick={() => window.location.reload()}>
        Повторить
      </button>
    </div>
  );
}
export function Header() {
  const { data } = useCatalog();
  const [menu, setMenu] = useState(false),
    [search, setSearch] = useState(false),
    [q, setQ] = useState("");
  const [loc, navigate] = useLocation();
  useEffect(() => {
    setMenu(false);
    setSearch(false);
  }, [loc]);
  return (
    <>
      <div className="announcement">
        {data?.settings.announcement || "INFINIE SP · БАЗОВЫЙ ГАРДЕРОБ С ХАРАКТЕРОМ"}
        <span>КАЗАХСТАН / KZT</span>
      </div>
      <header className="header">
        <button
          className="mobile-menu icon-btn"
          aria-label="Открыть меню"
          onClick={() => setMenu(!menu)}
        >
          {menu ? <X size={21} /> : <Menu size={21} />}
        </button>
        <Link href="/" className="wordmark">
          <BrandLogo />
        </Link>
        <nav className={menu ? "nav open" : "nav"}>
          <Link href="/catalog" className={loc === "/catalog" ? "active" : ""}>
            Коллекция
          </Link>
          <Link href="/category/zhenskie">Женщинам</Link>
          <Link href="/category/muzhskie">Мужчинам</Link>
          <Link href="/about">О бренде</Link>
        </nav>
        <div className="header-actions">
          <button className="icon-btn" aria-label="Поиск" onClick={() => setSearch(!search)}>
            <Search size={19} />
            <span>Поиск</span>
          </button>
          <Link href="/favorites" className="icon-btn" aria-label="Избранное">
            <Heart size={19} />
          </Link>
        </div>
      </header>
      {search && (
        <form
          className="searchbar"
          onSubmit={(e) => {
            e.preventDefault();
            navigate("/catalog?q=" + encodeURIComponent(q));
            setSearch(false);
          }}
        >
          <Search size={20} />
          <input
            aria-label="Поиск по каталогу"
            placeholder="Название, артикул или описание"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button type="submit">
            Найти <ArrowRight size={18} />
          </button>
        </form>
      )}
    </>
  );
}
export function Footer() {
  return (
    <footer>
      <div className="footer-top">
        <div>
          <Link href="/" className="wordmark">
            <BrandLogo />
          </Link>
          <p>
            Хорошая база.
            <br />
            Без лишних деталей.
          </p>
        </div>
        <div>
          <h4>Коллекция</h4>
          <Link href="/catalog">Все товары</Link>
          <Link href="/category/zhenskie">Женщинам</Link>
          <Link href="/category/muzhskie">Мужчинам</Link>
        </div>
        <div>
          <h4>Информация</h4>
          <Link href="/about">О бренде</Link>
          <Link href="/terms">Покупка на Kaspi</Link>
          <Link href="/contacts">Контакты</Link>
        </div>
        <div className="footer-note">
          <span className="eyebrow">ПРОСТО ВЫБРАТЬ. УДОБНО КУПИТЬ.</span>
          <p>
            Изучайте коллекцию здесь.
            <br />
            Покупайте в Kaspi Магазине.
          </p>
          <a
            href="https://kaspi.kz/shop/m/30375738/products"
            target="_blank"
            rel="noopener noreferrer"
          >
            Магазин на Kaspi <ArrowUpRight size={16} />
          </a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} INFINIE SP</span>
        <Link href="/privacy">Конфиденциальность</Link>
        <Link href="/admin">Управление каталогом</Link>
        <span>RU · KZ</span>
      </div>
    </footer>
  );
}
export function ProductCard({ p }: { p: any }) {
  const [fav, setFav] = useState(() =>
    JSON.parse(localStorage.getItem("infinie-favorites") || "[]").includes(p.id),
  );
  const img = p.images?.[0];
  return (
    <article className="product-card">
      <div className="product-image">
        <Link href={"/product/" + p.slug}>
          <img
            src={img?.thumb || img?.url || "/images/fallback.svg"}
            srcSet={img?.thumb ? `${img.thumb} 600w, ${img.url} 1200w` : undefined}
            sizes="(max-width:600px) 48vw, 25vw"
            alt={img?.alt || p.name}
            loading="lazy"
          />
        </Link>
        <button
          aria-label={fav ? "Удалить из избранного" : "Добавить в избранное"}
          className={"favorite " + (fav ? "selected" : "")}
          onClick={() => {
            const ids = JSON.parse(localStorage.getItem("infinie-favorites") || "[]");
            localStorage.setItem(
              "infinie-favorites",
              JSON.stringify(fav ? ids.filter((id: string) => id !== p.id) : [...ids, p.id]),
            );
            setFav(!fav);
          }}
        >
          <Heart size={18} fill={fav ? "currentColor" : "none"} />
        </button>
        <Link href={"/product/" + p.slug} className="image-cta">
          Подробнее <ArrowUpRight size={17} />
        </Link>
      </div>
      <div className="product-meta">
        <span>
          {p.categories?.includes("zhenskie")
            ? "ЖЕНСКАЯ КОЛЛЕКЦИЯ"
            : p.categories?.includes("muzhskie")
              ? "МУЖСКАЯ КОЛЛЕКЦИЯ"
              : "БАЗОВАЯ КОЛЛЕКЦИЯ"}
        </span>
        <span>{p.rating ? "★ " + p.rating.toFixed(2) : ""}</span>
      </div>
      <Link href={"/product/" + p.slug} className="product-name">
        {shortName(p)}
      </Link>
      <div className="price-row">
        <span>
          {p.variants?.length ? "от " : ""}
          {price(p)}
        </span>
        <div className="swatches">
          {p.links?.map((l: any) => (
            <span key={l.color} title={l.color} style={{ background: colorHex(l.color) }} />
          ))}
        </div>
      </div>
      <a
        className="card-kaspi"
        href={p.links?.[0]?.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() =>
          window.dispatchEvent(
            new CustomEvent("infinie:kaspi", { detail: { id: p.id, category: p.categories?.[0] } }),
          )
        }
      >
        {p.links?.[0] ? "Купить на Kaspi" : "Ссылка требует проверки"}
        {p.links?.[0] && <ArrowUpRight size={13} />}
      </a>
    </article>
  );
}
export function SectionTitle({
  label,
  title,
  link,
}: {
  label: string;
  title: string;
  link?: string;
}) {
  return (
    <div className="section-heading">
      <div>
        <span className="eyebrow">{label}</span>
        <h2>{title}</h2>
      </div>
      {link && (
        <Link href={link} className="text-link">
          Смотреть коллекцию <ArrowUpRight size={18} />
        </Link>
      )}
    </div>
  );
}
