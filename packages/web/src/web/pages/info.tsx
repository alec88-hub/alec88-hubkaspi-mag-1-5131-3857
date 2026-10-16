import { Link, useLocation } from "wouter";
import { useCatalog } from "../queries/catalog";
import { Loading } from "../components/store";
export default function Info() {
  const [loc] = useLocation();
  const { data, isLoading } = useCatalog();
  if (isLoading) return <Loading />;
  const s = data?.settings || {};
  const titles: Record<string, string> = {
    "/about": "Хорошая база. Без лишних деталей.",
    "/privacy": "Конфиденциальность",
    "/terms": "Покупка на Kaspi",
    "/contacts": "Контакты",
  };
  return (
    <main className="info-page">
      <span className="eyebrow">INFINIE SP</span>
      <h1 className={loc === "/privacy" ? "info-title-long" : undefined}>
        {titles[loc] || "Страница не найдена"}
      </h1>
      {loc === "/about" && <img src="/reference/lifestyle.jpg" alt="Базовый гардероб INFINIE SP" />}
      <p>
        {loc === "/about"
          ? s.about
          : loc === "/privacy"
            ? s.privacy
            : loc === "/terms"
              ? s.terms
              : loc === "/contacts"
                ? s.contact ||
                  "Контактная информация магазина пока не опубликована. Связаться с продавцом можно через его страницу в Kaspi Магазине."
                : "Такой страницы нет в каталоге."}
      </p>
      {loc === "/contacts" && (
        <a
          className="text-link"
          href="https://kaspi.kz/shop/m/30375738/products"
          target="_blank"
          rel="noopener noreferrer"
        >
          Открыть магазин на Kaspi ↗
        </a>
      )}
      <Link href="/catalog" className="button">
        Найти свою футболку
      </Link>
    </main>
  );
}
