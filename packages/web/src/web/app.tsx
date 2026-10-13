import { Route, Switch, useLocation } from "wouter";
import { useEffect } from "react";
import { Provider } from "./components/provider";
import { Header, Footer } from "./components/store";
import Home from "./pages/home";
import Catalog from "./pages/catalog";
import Product from "./pages/product";
import Info from "./pages/info";
import Admin from "./pages/admin";
import { AgentFeedback, RunableBadge } from "@runablehq/website-runtime";
import { useCatalog } from "./queries/catalog";
function Metadata() {
  const [loc] = useLocation();
  const { data } = useCatalog();
  useEffect(() => {
    window.scrollTo(0, 0);
    const p = data?.products.find((p: any) => loc === "/product/" + p.slug);
    const cat = data?.categories.find((c: any) => loc === "/category/" + c.slug);
    document.title =
      p?.seoTitle ||
      cat?.seoTitle ||
      (cat
        ? cat.name + " | INFINIE SP"
        : loc === "/catalog"
          ? "Коллекция | INFINIE SP"
          : "INFINIE SP — базовый гардероб с характером");
    const meta = document.querySelector('meta[name="description"]');
    meta?.setAttribute(
      "content",
      p?.seoDescription ||
        cat?.seoDescription ||
        "Свободные силуэты, натуральный хлопок и базовая коллекция INFINIE SP. Выберите своё и купите на Kaspi.",
    );
  }, [loc, data]);
  return null;
}
function Store() {
  const [loc] = useLocation();
  const admin = loc.startsWith("/admin");
  return (
    <>
      <Metadata />
      {!admin && <Header />}
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/catalog" component={Catalog} />
        <Route path="/category/:slug" component={Catalog} />
        <Route path="/favorites" component={Catalog} />
        <Route path="/product/:slug" component={Product} />
        <Route path="/admin" component={Admin} />
        <Route component={Info} />
      </Switch>
      {!admin && <Footer />}
    </>
  );
}
export default function App() {
  return (
    <Provider>
      <Store />
      {import.meta.env.DEV && <AgentFeedback />}
      <RunableBadge />
    </Provider>
  );
}
