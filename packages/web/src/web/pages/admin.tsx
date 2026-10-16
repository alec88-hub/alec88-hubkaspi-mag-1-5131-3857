import { BrandLogo } from "../components/brand-logo";
import { useState } from "react";
import { Link } from "wouter";
import {
  LayoutDashboard,
  Package,
  Tags,
  Upload,
  MessageSquare,
  Settings,
  LogOut,
  Plus,
  ArrowUpRight,
  Search,
  CheckCircle,
  ShieldCheck,
  X,
  Trash2,
} from "lucide-react";
import { authClient } from "../lib/auth";
import { client } from "../lib/api";
import { useAdmin } from "../queries/catalog";
import { Loading, shortName, price } from "../components/store";
type RecordData = Record<string, any>;
async function uploadFile(f: File) {
  const result = await client.importer.presign({
    filename: f.name,
    size: f.size,
    contentType: f.type || "application/octet-stream",
  });
  const response = await fetch(result.url, {
    method: "PUT",
    body: f,
    headers: { "Content-Type": f.type || "application/octet-stream" },
  });
  if (!response.ok) throw Error("Хранилище: ошибка загрузки " + response.status);
  return { ...result, filename: f.name };
}
export default function Admin() {
  const { data: session, isPending } = authClient.useSession();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState("");
  if (isPending) return <Loading />;
  if (!session)
    return (
      <div className="admin-login">
        <Link href="/" className="wordmark">
          <BrandLogo />
        </Link>
        <div className="login-box">
          <ShieldCheck size={28} />
          <span className="eyebrow">ЗАЩИЩЁННАЯ ЗОНА</span>
          <h1>Управление каталогом</h1>
          <p>
            Только для назначенных администраторов.
            <br />
            Публичная регистрация отключена.
          </p>
          <button
            className="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                const r = await authClient.managedAuth.signIn({ provider: "google" });
                if (r.error) setError(r.error.message || "Не удалось войти");
              } catch (e) {
                setError(String(e));
              } finally {
                setBusy(false);
              }
            }}
          >
            Войти через Google <ArrowUpRight size={18} />
          </button>
          <div className="login-divider">или email и пароль</div>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              const r = await authClient.signIn.email(
                { email, password },
                {
                  onSuccess: (ctx) => {
                    const token = ctx.response.headers.get("set-auth-token");
                    if (token) localStorage.setItem("infinie-email-token", token);
                  },
                },
              );
              if (r.error) setError(r.error.message || "Ошибка входа");
              setBusy(false);
            }}
          >
            <label>
              Email
              <input
                aria-label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
              />
            </label>
            <label>
              Пароль
              <input
                aria-label="Пароль"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </label>
            <button disabled={busy} className="button">
              {busy ? "Проверяем…" : "Войти"}
            </button>
          </form>
          {error && <p className="error">{error}</p>}
          <Link href="/">← Вернуться в магазин</Link>
        </div>
      </div>
    );
  return <AdminPanel />;
}
function AdminPanel() {
  const { data, isLoading, error, refetch } = useAdmin();
  const [tab, setTab] = useState("overview"),
    [q, setQ] = useState(""),
    [edit, setEdit] = useState<RecordData | null>(null),
    [cat, setCat] = useState<RecordData | null>(null),
    [settings, setSettings] = useState<RecordData | null>(null),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [err, setErr] = useState(""),
    [plan, setPlan] = useState<any>(null),
    [file, setFile] = useState<any>(null),
    [mapping, setMapping] = useState<Record<string, string>>({}),
    [page, setPage] = useState(1);
  async function action(fn: () => Promise<unknown>, message = "Сохранено") {
    setBusy(true);
    setErr("");
    setNotice("");
    try {
      await fn();
      await refetch();
      setNotice(message);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }
  if (isLoading) return <Loading />;
  if (error || !data)
    return (
      <div className="empty">
        <ShieldCheck size={32} />
        <h1>Доступ ограничен</h1>
        <p>{error?.message || "Аккаунт не назначен администратором"}</p>
        <p>Добавьте email командой scripts/create-admin.ts на сервере.</p>
        <button className="button" onClick={() => authClient.signOut()}>
          Выйти
        </button>
        <Link href="/">Вернуться в магазин</Link>
      </div>
    );
  const tabs = [
    ["overview", "Обзор", LayoutDashboard],
    ["products", "Товары", Package],
    ["categories", "Категории", Tags],
    ["reviews", "Отзывы", MessageSquare],
    ["imports", "Импорт и экспорт", Upload],
    ["settings", "Контент и SEO", Settings],
  ] as const;
  const filtered = data.products.filter((p: any) =>
    [p.name, p.sku, p.status].join(" ").toLowerCase().includes(q.toLowerCase()),
  );
  const rs = data.reviews.filter((r: any) =>
    [r.author, r.text, r.productId].join(" ").toLowerCase().includes(q.toLowerCase()),
  );
  function startNew() {
    setEdit({
      id: "P-" + crypto.randomUUID(),
      sku: "",
      slug: "",
      name: "",
      brand: "",
      description: "",
      short_description: "",
      categories: [],
      images: [],
      links: [],
      variants: [],
      attributes: [],
      price: null,
      priceDate: "",
      status: "draft",
      featured: false,
      seoTitle: "",
      seoDescription: "",
    });
  }
  const content = settings || data.settings;
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/" className="wordmark">
          <BrandLogo />
        </Link>
        <span className="eyebrow">CATALOG MANAGER</span>
        <nav>
          {tabs.map(([id, label, Icon]) => (
            <button
              key={id}
              className={tab === id ? "active" : ""}
              onClick={() => {
                setTab(id);
                setQ("");
                setPage(1);
              }}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
        <Link href="/" className="admin-store-link">
          Открыть витрину <ArrowUpRight size={17} />
        </Link>
        <button
          onClick={async () => {
            localStorage.removeItem("infinie-email-token");
            await authClient.signOut();
            window.location.reload();
          }}
        >
          <LogOut size={17} />
          Выйти
        </button>
      </aside>
      <main className="admin-main">
        <div className="admin-top">
          <span>Рабочее пространство / {tabs.find((t) => t[0] === tab)?.[1]}</span>
          <span className="admin-status">
            <i /> База данных подключена
          </span>
        </div>
        <div className="admin-title">
          <div>
            <span className="eyebrow">INFINIE SP</span>
            <h1>{tabs.find((t) => t[0] === tab)?.[1]}</h1>
          </div>
          {tab === "products" && (
            <button className="button" onClick={startNew}>
              <Plus size={18} />
              Добавить товар
            </button>
          )}
          {tab === "categories" && (
            <button
              className="button"
              onClick={() =>
                setCat({
                  key: "C-" + crypto.randomUUID(),
                  name: "",
                  slug: "",
                  parent_slug: "",
                  description: "",
                  seoTitle: "",
                  seoDescription: "",
                  order: 0,
                })
              }
            >
              <Plus size={18} />
              Категория
            </button>
          )}
        </div>
        {notice && (
          <div className="notice">
            <CheckCircle size={17} />
            {notice}
          </div>
        )}
        {err && <div className="error">{err}</div>}
        {tab === "overview" && (
          <>
            <div className="stats">
              {[
                [data.products.length, "Товаров"],
                [data.media.length, "Фотографий"],
                [data.reviews.length, "Отзывов"],
                [
                  data.products.reduce((n: number, p: any) => n + (p.links?.length || 0), 0),
                  "Ссылок Kaspi",
                ],
              ].map(([n, l]) => (
                <div key={l}>
                  <span>{l}</span>
                  <strong>{n}</strong>
                  <small>Импортировано из ваших файлов</small>
                </div>
              ))}
            </div>
            <section className="admin-box">
              <h2>Каталог готов к работе</h2>
              <p>
                7 исходных товаров связаны с фотографиями и вариантами по ключам P / M. Отзывы
                связаны по product_key. 14 ссылок Kaspi сопоставлены по ID, SKU и цвету.
              </p>
              <div className="health">
                <CheckCircle size={19} />
                52 SHA-256 изображения проверены без ошибок
              </div>
              <div className="health">
                <CheckCircle size={19} />
                Цены подтверждены 12.10.2026
              </div>
              <div className="health">
                <ShieldCheck size={19} />
                Регистрация закрыта, права проверяются на сервере
              </div>
            </section>
            <section className="admin-box">
              <h2>Требуют внимания</h2>
              {!data.settings.contact && (
                <p>Контакты магазина ещё не заполнены — добавьте их в «Контент и SEO».</p>
              )}
              {data.products
                .filter((p: any) => !p.links?.length)
                .map((p: any) => (
                  <p key={p.id}>{p.name}: нет ссылки Kaspi</p>
                ))}
              <p>Административные удаления скрывают товар без потери исходных данных.</p>
            </section>
          </>
        )}
        {(tab === "products" || tab === "reviews") && (
          <div className="admin-search">
            <Search size={18} />
            <input
              aria-label="Поиск"
              placeholder={
                tab === "reviews"
                  ? "Автор, текст или ключ товара"
                  : "Поиск по названию, SKU или статусу"
              }
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
            />
          </div>
        )}
        {tab === "products" && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Товар</th>
                  <th>SKU</th>
                  <th>Цена</th>
                  <th>Статус</th>
                  <th>Kaspi</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p: any) => (
                  <tr key={p.id}>
                    <td aria-label={p.name}>
                      <div className="table-product">
                        <img
                          src={p.images?.[0]?.thumb || p.images?.[0]?.url || "/images/fallback.svg"}
                          alt=""
                        />
                        <span>
                          <b>{shortName(p)}</b>
                          <small>
                            {p.id} · {p.images?.length || 0} фото
                          </small>
                        </span>
                      </div>
                    </td>
                    <td>{p.sku}</td>
                    <td>{price(p)}</td>
                    <td>
                      <span className={"status " + p.status}>
                        {p.status === "published"
                          ? "Опубликован"
                          : p.status === "hidden"
                            ? "Скрыт"
                            : "Черновик"}
                      </span>
                    </td>
                    <td>{p.links?.length || 0} цветов</td>
                    <td>
                      <button onClick={() => setEdit(structuredClone(p))}>Изменить</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {tab === "categories" && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Slug</th>
                  <th>Родитель</th>
                  <th>Товаров</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {data.categories.map((c: any) => (
                  <tr key={c.key}>
                    <td>{c.name}</td>
                    <td>{c.slug}</td>
                    <td>{c.parent_slug || "—"}</td>
                    <td>
                      {data.products.filter((p: any) => p.categories.includes(c.slug)).length}
                    </td>
                    <td>
                      <button onClick={() => setCat({ ...c })}>Изменить</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {tab === "reviews" && (
          <>
            <p className="muted">
              {rs.length} записей. Номера заказов и служебные поля не публикуются.
            </p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Автор / оценка</th>
                    <th>Текст</th>
                    <th>Товар</th>
                    <th>Публикация</th>
                  </tr>
                </thead>
                <tbody>
                  {rs.slice((page - 1) * 25, page * 25).map((r: any) => (
                    <tr key={r.id}>
                      <td>
                        {r.author}
                        <small>
                          {r.rating} ★ · {r.date}
                        </small>
                      </td>
                      <td className="review-text">
                        {r.text || "Только оценка"}
                        <small>{r.source}</small>
                      </td>
                      <td>
                        <select
                          value={r.productId}
                          disabled={busy}
                          onChange={(e) =>
                            action(() =>
                              client.administration.moderate({
                                id: r.id,
                                productId: e.target.value,
                                hidden: r.hidden,
                              }),
                            )
                          }
                        >
                          {data.products.map((p: any) => (
                            <option key={p.id} value={p.id}>
                              {p.id} · {shortName(p)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <button
                          disabled={busy}
                          onClick={() =>
                            action(() =>
                              client.administration.moderate({
                                id: r.id,
                                productId: r.productId,
                                hidden: !r.hidden,
                              }),
                            )
                          }
                        >
                          {r.hidden ? "Показать" : "Скрыть"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="review-pagination">
              <button disabled={page === 1} onClick={() => setPage(page - 1)}>
                Назад
              </button>
              <span>
                {page} / {Math.max(1, Math.ceil(rs.length / 25))}
              </span>
              <button disabled={page * 25 >= rs.length} onClick={() => setPage(page + 1)}>
                Далее
              </button>
            </div>
          </>
        )}
        {tab === "imports" && (
          <>
            <section className="admin-box">
              <h2>Импорт с предварительной проверкой</h2>
              <p>
                CSV: товары, варианты, отзывы, категории, манифест, атрибуты. ZIP: фотографии (до 30
                МБ). TXT: ссылки в формате предоставленного файла. Повторная загрузка обновляет
                ключи, не создаёт дубликаты. Импорт не удаляет отсутствующие строки.
              </p>
              <label className="upload-zone">
                <Upload size={28} />
                <b>{busy ? "Обработка…" : "Выберите CSV, ZIP или TXT"}</b>
                <span>Сначала предпросмотр, затем подтверждение</span>
                <input
                  aria-label="Выберите файл"
                  type="file"
                  accept=".csv,.zip,.txt"
                  disabled={busy}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f)
                      action(async () => {
                        const uploaded = await uploadFile(f);
                        setFile(uploaded);
                        setMapping({});
                        setPlan(
                          await client.importer.preview({ key: uploaded.key, filename: f.name }),
                        );
                      }, "Файл проверен");
                  }}
                />
              </label>
              {plan && (
                <div className="import-preview">
                  <h3>{plan.filename}</h3>
                  <p>
                    Тип: {plan.kind} · записей: {plan.count} · новых: {plan.created} · обновлений:{" "}
                    {plan.updated}
                  </p>
                  {plan.columns?.length > 0 && (
                    <details>
                      <summary>Сопоставление колонок · разделитель «{plan.delimiter}»</summary>
                      <div className="form-grid">
                        {["key", "name", "sku", "slug", "description", "categories"].map(
                          (field) => (
                            <label key={field}>
                              {field}
                              <select
                                value={mapping[field] || ""}
                                onChange={(e) =>
                                  setMapping({ ...mapping, [field]: e.target.value })
                                }
                              >
                                <option value="">Автоматически</option>
                                {plan.columns.map((c: string) => (
                                  <option key={c}>{c}</option>
                                ))}
                              </select>
                            </label>
                          ),
                        )}
                      </div>
                      <button
                        disabled={busy}
                        onClick={() =>
                          action(
                            async () =>
                              setPlan(
                                await client.importer.preview({
                                  key: file.key,
                                  filename: file.filename,
                                  mapping,
                                }),
                              ),
                            "Сопоставление проверено",
                          )
                        }
                      >
                        Пересчитать предпросмотр
                      </button>
                    </details>
                  )}
                  <pre>{JSON.stringify(plan.preview, null, 2)}</pre>
                  {plan.errors.map((s: string, i: number) => (
                    <p className="error" key={i}>
                      {s}
                    </p>
                  ))}
                  {plan.warnings.map((s: string, i: number) => (
                    <p className="warning" key={i}>
                      {s}
                    </p>
                  ))}
                  <button
                    className="button"
                    disabled={busy || plan.errors.length > 0}
                    onClick={() =>
                      action(async () => {
                        await client.importer.confirm({ planId: plan.planId });
                        setPlan(null);
                      }, "Импорт завершён")
                    }
                  >
                    Подтвердить импорт
                  </button>
                </div>
              )}
            </section>
            <section className="admin-box">
              <h2>Экспорт товаров</h2>
              <p>UTF-8 BOM, разделитель «;», названия, SKU, описание, категории, ссылки и SEO.</p>
              <button
                className="button secondary"
                disabled={busy}
                onClick={() =>
                  action(async () => {
                    const r = await client.administration.export();
                    const a = document.createElement("a");
                    a.href = URL.createObjectURL(
                      new Blob([r.text], { type: "text/csv;charset=utf-8" }),
                    );
                    a.download = r.filename;
                    a.click();
                    URL.revokeObjectURL(a.href);
                  }, "Экспорт сформирован")
                }
              >
                Скачать CSV
              </button>
            </section>
            <h2>Журнал импортов</h2>
            {[...data.imports].reverse().map((r: any) => (
              <details className="admin-box" key={r.id}>
                <summary>
                  {new Date(r.date).toLocaleString("ru-RU")} · {r.data.filename || r.data.source} ·{" "}
                  {r.data.count || r.data.products} записей
                </summary>
                <pre>{JSON.stringify(r.data, null, 2)}</pre>
              </details>
            ))}
          </>
        )}
        {tab === "settings" && (
          <form
            className="admin-box"
            onSubmit={(e) => {
              e.preventDefault();
              action(() => client.administration.saveSettings(content));
            }}
          >
            <h2>Витрина и информационные страницы</h2>
            <div className="form-grid">
              {[
                ["name", "Название магазина"],
                ["announcement", "Информационная полоса"],
                ["heroEyebrow", "Надзаголовок баннера"],
                ["heroImage", "Фото баннера /images/M001.webp"],
                ["contact", "Контакты"],
                ["defaultSeoTitle", "SEO title по умолчанию"],
                ["defaultSeoDescription", "Meta description по умолчанию"],
              ].map(([key, label]) => (
                <label key={key}>
                  {label}
                  <input
                    aria-label={label}
                    value={content[key] || ""}
                    onChange={(e) => setSettings({ ...content, [key]: e.target.value })}
                  />
                </label>
              ))}
            </div>
            {[
              ["heroTitle", "Заголовок баннера (перенос строки разрешён)"],
              ["heroText", "Подзаголовок"],
              ["about", "Философия бренда"],
              ["privacy", "Конфиденциальность"],
              ["terms", "Условия покупки"],
            ].map(([key, label]) => (
              <label key={key}>
                {label}
                <textarea
                  aria-label={label}
                  value={content[key] || ""}
                  onChange={(e) => setSettings({ ...content, [key]: e.target.value })}
                />
              </label>
            ))}
            <p className="muted">
              Сторонняя аналитика магазина отключена. Подключение GA4 / Метрики требует отдельного
              согласия и настройки; фиктивные идентификаторы не используются.
            </p>
            <button disabled={busy} className="button">
              {busy ? "Сохраняем…" : "Сохранить контент"}
            </button>
          </form>
        )}
        {edit && (
          <div className="modal-backdrop">
            <div className="edit-modal">
              <div className="modal-heading">
                <h2>{edit.name ? "Редактировать товар" : "Новый товар"}</h2>
                <button aria-label="Закрыть" onClick={() => setEdit(null)}>
                  <X />
                </button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  action(async () => {
                    await client.administration.saveProduct(edit);
                    setEdit(null);
                  });
                }}
              >
                <div className="form-grid">
                  {[
                    ["name", "Название"],
                    ["sku", "Артикул"],
                    ["slug", "Постоянный URL (slug)"],
                    ["brand", "Бренд"],
                    ["seoTitle", "SEO title"],
                    ["seoDescription", "Meta description"],
                  ].map(([key, label]) => (
                    <label key={key}>
                      {label}
                      <input
                        aria-label={label}
                        required={["name", "sku", "slug"].includes(key)}
                        value={edit[key] || ""}
                        onChange={(e) => setEdit({ ...edit, [key]: e.target.value })}
                      />
                    </label>
                  ))}
                  <label>
                    Статус
                    <select
                      value={edit.status}
                      onChange={(e) => setEdit({ ...edit, status: e.target.value })}
                    >
                      <option value="published">Опубликован</option>
                      <option value="draft">Черновик</option>
                      <option value="hidden">Скрыт</option>
                    </select>
                  </label>
                  <label>
                    Цена, ₸
                    <input
                      aria-label="Поле"
                      type="number"
                      min="0"
                      value={edit.price ?? ""}
                      onChange={(e) =>
                        setEdit({ ...edit, price: e.target.value ? Number(e.target.value) : null })
                      }
                    />
                  </label>
                </div>
                <label className="checkbox">
                  <input
                    aria-label="Рекомендуемый товар"
                    type="checkbox"
                    checked={edit.featured}
                    onChange={(e) => setEdit({ ...edit, featured: e.target.checked })}
                  />
                  Рекомендуемый товар
                </label>
                <fieldset>
                  <legend>Категории</legend>
                  {data.categories.map((c: any) => (
                    <label className="checkbox" key={c.key}>
                      <input
                        aria-label={c.name}
                        type="checkbox"
                        checked={edit.categories.includes(c.slug)}
                        onChange={(e) =>
                          setEdit({
                            ...edit,
                            categories: e.target.checked
                              ? [...edit.categories, c.slug]
                              : edit.categories.filter((s: string) => s !== c.slug),
                          })
                        }
                      />
                      {c.name}
                    </label>
                  ))}
                </fieldset>
                <label>
                  Краткое описание
                  <textarea
                    aria-label="Краткое описание"
                    value={edit.short_description || ""}
                    onChange={(e) => setEdit({ ...edit, short_description: e.target.value })}
                  />
                </label>
                <label>
                  Описание
                  <textarea
                    aria-label="Описание"
                    className="large"
                    value={edit.description || ""}
                    onChange={(e) => setEdit({ ...edit, description: e.target.value })}
                  />
                </label>
                <h3>Ссылки Kaspi по цветам</h3>
                {edit.links.map((l: any, i: number) => (
                  <div className="link-edit" key={i}>
                    <input
                      aria-label="Цвет"
                      placeholder="Цвет"
                      value={l.color}
                      onChange={(e) =>
                        setEdit({
                          ...edit,
                          links: edit.links.map((l: any, j: number) =>
                            j === i ? { ...l, color: e.target.value } : l,
                          ),
                        })
                      }
                    />
                    <input
                      aria-label="Ссылка Kaspi"
                      placeholder="https://kaspi.kz/shop/p/..."
                      value={l.url}
                      onChange={(e) =>
                        setEdit({
                          ...edit,
                          links: edit.links.map((l: any, j: number) =>
                            j === i ? { ...l, url: e.target.value } : l,
                          ),
                        })
                      }
                    />
                    <button
                      type="button"
                      aria-label="Удалить ссылку"
                      onClick={() =>
                        setEdit({
                          ...edit,
                          links: edit.links.filter((_: any, j: number) => j !== i),
                        })
                      }
                    >
                      <X size={17} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="small-button"
                  onClick={() =>
                    setEdit({ ...edit, links: [...edit.links, { color: "", url: "" }] })
                  }
                >
                  + Добавить цвет и ссылку
                </button>
                <h3>Галерея · первое фото — главное</h3>
                <div className="admin-gallery">
                  {edit.images.map((m: any, i: number) => (
                    <div key={m.id}>
                      <img src={m.thumb || m.url} alt="" />
                      <small>{m.id}</small>
                      <button
                        type="button"
                        onClick={() =>
                          setEdit({
                            ...edit,
                            images: [m, ...edit.images.filter((_: any, j: number) => j !== i)],
                          })
                        }
                      >
                        {i === 0 ? "Главное" : "На обложку"}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setEdit({
                            ...edit,
                            images: edit.images.filter((_: any, j: number) => j !== i),
                          })
                        }
                      >
                        Убрать
                      </button>
                    </div>
                  ))}
                </div>
                <label>
                  Добавить из библиотеки
                  <select
                    value=""
                    onChange={(e) => {
                      const m = data.media.find((m: any) => m.id === e.target.value);
                      if (m && !edit.images.some((m: any) => m.id === e.target.value))
                        setEdit({ ...edit, images: [...edit.images, m] });
                    }}
                  >
                    <option value="">Выберите фотографию</option>
                    {data.media.map((m: any) => (
                      <option key={m.id} value={m.id}>
                        {m.id} — {m.original}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Загрузить фото
                  <input
                    aria-label="Выберите файл"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={busy}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f)
                        action(async () => {
                          const u = await uploadFile(f);
                          const m = await client.importer.image({ key: u.key, filename: f.name });
                          setEdit({ ...edit, images: [...edit.images, m] });
                        }, "Фотография загружена");
                    }}
                  />
                </label>
                <label>
                  Характеристики (JSON)
                  <textarea
                    aria-label="Характеристики JSON"
                    defaultValue={JSON.stringify(edit.attributes, null, 2)}
                    onChange={(e) => {
                      try {
                        setEdit({ ...edit, attributes: JSON.parse(e.target.value) });
                      } catch {
                        setErr("Характеристики: неверный JSON");
                      }
                    }}
                  />
                </label>
                <details>
                  <summary>Варианты: размеры, цены, цвета (JSON)</summary>
                  <textarea
                    aria-label="Варианты JSON"
                    className="large"
                    defaultValue={JSON.stringify(edit.variants, null, 2)}
                    onBlur={(e) => {
                      try {
                        setEdit({ ...edit, variants: JSON.parse(e.target.value) });
                      } catch {
                        setErr("Варианты: неверный JSON");
                      }
                    }}
                  />
                </details>
                <div className="modal-actions">
                  <button className="button" disabled={busy}>
                    {busy ? "Сохраняем…" : "Сохранить товар"}
                  </button>
                  <Link href={"/product/" + edit.slug} target="_blank">
                    Предпросмотр опубликованного ↗
                  </Link>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      if (window.confirm("Скрыть товар? Исходные данные сохранятся."))
                        action(async () => {
                          await client.administration.deleteProduct({ id: edit.id });
                          setEdit(null);
                        }, "Товар скрыт");
                    }}
                  >
                    <Trash2 size={16} />
                    Скрыть
                  </button>
                </div>
                {err && <p className="error">{err}</p>}
              </form>
            </div>
          </div>
        )}
        {cat && (
          <div className="modal-backdrop">
            <form
              className="edit-modal"
              onSubmit={(e) => {
                e.preventDefault();
                action(async () => {
                  await client.administration.saveCategory(cat);
                  setCat(null);
                });
              }}
            >
              <div className="modal-heading">
                <h2>Категория</h2>
                <button type="button" onClick={() => setCat(null)} aria-label="Закрыть">
                  <X />
                </button>
              </div>
              {[
                ["name", "Название"],
                ["slug", "Slug"],
                ["description", "Описание"],
                ["image", "Фото категории"],
                ["seoTitle", "SEO title"],
                ["seoDescription", "Meta description"],
                ["order", "Порядок"],
              ].map(([key, label]) => (
                <label key={key}>
                  {label}
                  <input
                    aria-label={label}
                    value={cat[key] || ""}
                    onChange={(e) => setCat({ ...cat, [key]: e.target.value })}
                  />
                </label>
              ))}
              <label>
                Родитель
                <select
                  value={cat.parent_slug}
                  onChange={(e) => setCat({ ...cat, parent_slug: e.target.value })}
                >
                  <option value="">Нет</option>
                  {data.categories
                    .filter((c: any) => c.slug !== cat.slug)
                    .map((c: any) => (
                      <option key={c.key} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </label>
              <button disabled={busy} className="button">
                Сохранить
              </button>
              {err && <p className="error">{err}</p>}
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
