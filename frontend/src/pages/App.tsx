import { useEffect, useState } from "react";
import { useDashboard } from "../hooks/useDashboard";
import { useNewsSearch } from "../hooks/useNewsSearch";
import { Article, triggerIngestion } from "../lib/api";

const tabs = ["Home", "Today", "Yesterday", "Weekly", "Monthly"] as const;
type Tab = (typeof tabs)[number];
type ThemeMode = "light" | "dark";

const tabTheme: Record<Tab, string> = {
  Home: "from-[#2f5faa] to-[#3b82f6]",
  Today: "from-[#20b15a] to-[#22c55e]",
  Yesterday: "from-[#f59e0b] to-[#f97316]",
  Weekly: "from-[#6d5efc] to-[#7c3aed]",
  Monthly: "from-[#ec4899] to-[#be185d]",
};

const tabLabels: Record<Tab, string> = {
  Home: "Front Page",
  Today: "Today Desk",
  Yesterday: "Yesterday Desk",
  Weekly: "Weekly Desk",
  Monthly: "Monthly Desk",
};

type SessionBar = {
  label: string;
  local: string;
  start: number;
  width: number;
  tone: string;
};

type CryptoCard = {
  id: string;
  label: string;
  value: string;
  delta: string;
  deltaTone: string;
  spark: number[];
  bullets: string[];
  takeaway: string;
};

type WatchItem = {
  name: string;
  price: number;
  change: number;
  timeframe: string;
  href: string;
};

const sourceFallbackUrls: Record<string, string> = {
  coindesk: "https://www.coindesk.com/",
  forexfactory: "https://www.forexfactory.com/news",
  "financial times": "https://www.ft.com/markets",
  "hacker news": "https://news.ycombinator.com/",
  moneycontrol: "https://www.moneycontrol.com/news/business/markets/",
  "economic times markets": "https://economictimes.indiatimes.com/markets",
  coingecko: "https://www.coingecko.com/en/news",
  investing: "https://www.investing.com/news/",
};

const marketLinks: Record<string, string> = {
  BTC: "https://www.tradingview.com/symbols/BTCUSD/",
  "NIFTY 50": "https://groww.in/indices/nifty",
  SENSEX: "https://groww.in/indices/sensex",
  Gold: "https://www.tradingview.com/symbols/XAUUSD/",
  ETH: "https://www.tradingview.com/symbols/ETHUSD/",
  "USD/INR": "https://www.tradingview.com/symbols/USDINR/",
  "USD/JPY": "https://www.tradingview.com/symbols/USDJPY/",
  CRUDE: "https://www.tradingview.com/symbols/TVC-USOIL/",
  SILVER: "https://www.tradingview.com/symbols/XAGUSD/",
  DXY: "https://www.tradingview.com/symbols/TVC-DXY/",
  "BANK NIFTY": "https://groww.in/indices/nifty-bank",
};

const officialSources = new Set([
  "ForexFactory",
  "Moneycontrol",
  "Financial Times",
  "CoinDesk",
  "CoinGecko",
  "Economic Times Markets",
  "Investing.com",
  "Google News Defense And Politics",
  "Google News Global Markets",
  "Hacker News",
]);

function isOfficialStory(article: Article): boolean {
  if (!officialSources.has(article.source)) return false;
  if (article.url.includes("/thread/") || article.url.includes("#post")) return false;
  if (article.source === "ForexFactory" && !article.url.includes("/news")) return false;
  return true;
}

function safeHref(article: Article): string {
  if (!article.url.includes("example.com")) return article.url;
  const key = Object.keys(sourceFallbackUrls).find((item) => article.source.toLowerCase().includes(item));
  return key ? sourceFallbackUrls[key] : "https://www.google.com/finance/";
}

function relativeTime(input: string): string {
  const minutes = Math.max(1, Math.round((Date.now() - new Date(input).getTime()) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function excerptText(article: Article, max = 200): string {
  const base = article.overview ?? article.excerpt ?? article.short_summary.join(" ");
  return base.length > max ? `${base.slice(0, max).trim()}...` : base;
}

function storyDeck(stories: Article[], fallback: Article[]): Article[] {
  if (stories.length > 0) return stories;
  if (fallback.length > 0) return fallback;
  return [];
}

function Sparkline({ points, colorClass }: { points: number[]; colorClass: string }) {
  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${index * 16} ${48 - point * 3.6}`)
    .join(" ");

  return (
    <svg viewBox="0 0 96 48" className="h-12 w-full">
      <path d={path} fill="none" stroke="currentColor" strokeWidth="3" className={colorClass} strokeLinecap="round" />
    </svg>
  );
}

function MetricBars({ points, colorClass }: { points: number[]; colorClass: string }) {
  return (
    <div className="flex h-14 items-end gap-1.5">
      {points.map((point, index) => (
        <div key={`${point}-${index}`} className={`flex-1 rounded-t-sm ${colorClass}`} style={{ height: `${point * 8}%` }} />
      ))}
    </div>
  );
}

function buildMacroRows(category: string, tab: Tab) {
  const base = [
    ["1:05 AM", "USD", "High", "FOMC member speaks", "Watch", "Fed stays patient", "Fed cuts later"],
    ["4:15 AM", "NZD", "Medium", "PPI input q/q", "1.4%", "0.8%", "-0.5%"],
    ["4:55 AM", "AUD", "Medium", "RBA assistant governor", "Live", "Hawkish hold", "Neutral tone"],
    ["9:30 AM", "IND", "High", "Nifty open tone / rupee watch", "Firm", "+0.20%", "Soft"],
    ["1:05 PM", "XAU", "High", "Gold intraday risk bias", "Bid", "2365 / bullish", "2351"],
    ["3:00 PM", "BTC", "Medium", "ETF flow snapshot", "Positive", "$190M est.", "$142M"],
  ];

  if (category === "Geopolitics") {
    return [
      ["8:10 AM", "IND", "High", "Defense / bilateral briefing watch", "Live", "Policy-positive", "Neutral"],
      ["11:30 AM", "EUR", "Medium", "Energy supply headlines", "Cautious", "Contained", "Contained"],
      ["1:05 PM", "XAU", "High", "Gold hedge response", "Bid", "2365 / bullish", "2351"],
      ["7:30 PM", "USD", "High", "US risk headline spillover", "Open", "Watch", "Watch"],
    ];
  }

  if (tab === "Yesterday") {
    return [
      ["9:15 AM", "IND", "High", "Yesterday opening sentiment", "Firm", "+0.10%", "Soft"],
      ["1:30 PM", "USD", "Medium", "Dollar repositioning", "Mixed", "Neutral", "Firm"],
      ["8:00 PM", "XAU", "High", "Gold close tone", "Bid", "Bullish", "Neutral"],
    ];
  }

  if (tab === "Weekly") {
    return [
      ["Mon", "IND", "High", "India benchmark trend", "Positive", "Constructive", "Flat"],
      ["Wed", "USD", "High", "Fed / rates sensitivity", "Mixed", "Cautious", "Bullish USD"],
      ["Fri", "XAU", "High", "Gold weekly bias", "Bid", "2365+", "2328"],
    ];
  }

  if (tab === "Monthly") {
    return [
      ["Week 1", "IND", "High", "Domestic policy / flows", "Positive", "Supportive", "Neutral"],
      ["Week 2", "USD", "High", "Macro trend regime", "Firm", "Sticky inflation", "Soft landing"],
      ["Week 4", "XAU", "High", "Gold monthly risk hedge", "Bullish", "Safe-haven bid", "Mixed"],
    ];
  }

  return base;
}

export function App() {
  const { data, loading, error } = useDashboard(30000);
  const [activeTab, setActiveTab] = useState<Tab>("Home");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  const [selectedCryptoMetric, setSelectedCryptoMetric] = useState("market-cap");
  const [now, setNow] = useState(new Date());
  const results = useNewsSearch(query, category);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const run = () => {
      triggerIngestion().catch(() => undefined);
    };
    run();
    const timer = window.setInterval(run, 60000);
    return () => window.clearInterval(timer);
  }, []);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-slate-300">Loading market desk...</div>;
  }

  if (error || !data) {
    return <div className="flex min-h-screen items-center justify-center text-rose-300">{error ?? "Dashboard unavailable"}</div>;
  }

  const isDark = themeMode === "dark";
  const shellClass = isDark ? "theme-dark" : "theme-light";

  const tabArticles: Record<Tab, Article[]> = {
    Home: data.today,
    Today: data.today,
    Yesterday: data.yesterday,
    Weekly: data.weekly,
    Monthly: data.monthly,
  };

  const rawTabStories = category ? tabArticles[activeTab].filter((item) => item.category === category) : tabArticles[activeTab];
  const officialTabStories = rawTabStories.filter(isOfficialStory);
  const homeOfficial = [...data.today, ...data.yesterday, ...data.weekly, ...data.monthly]
    .filter(isOfficialStory)
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
  const searchedStories = query ? results.filter(isOfficialStory) : [];
  const feed = query
    ? storyDeck(searchedStories, officialTabStories.length > 0 ? officialTabStories : rawTabStories)
    : activeTab === "Home"
      ? storyDeck(officialTabStories, rawTabStories.length > 0 ? rawTabStories : homeOfficial)
      : storyDeck(officialTabStories, rawTabStories);

  const homeFeed = storyDeck(data.today.filter(isOfficialStory), homeOfficial);
  const hotPulse = (activeTab === "Home" ? homeFeed : feed).slice(0, 4);
  const pinnedToday = homeFeed.slice(0, 2);
  const hotStory = activeTab === "Home" ? (homeFeed[0] ?? rawTabStories[0] ?? data.today[0]) : (feed[0] ?? rawTabStories[0]);
  const latestStories = feed.slice(0, 8);
  const globalStories =
    activeTab === "Home"
      ? storyDeck(homeOfficial.slice(0, 6), feed.slice(0, 6))
      : storyDeck(feed.slice(0, 6), rawTabStories.slice(0, 6));
  const yesterdayStories = storyDeck(data.yesterday.filter(isOfficialStory).slice(0, 4), data.yesterday.slice(0, 4));
  const weeklyStories = storyDeck(data.weekly.filter(isOfficialStory).slice(0, 4), data.weekly.slice(0, 4));
  const monthlyStories = storyDeck(data.monthly.filter(isOfficialStory).slice(0, 4), data.monthly.slice(0, 4));

  const trendingStories = storyDeck(
    feed.filter((item) => item.source === "ForexFactory" || item.source === "Moneycontrol").slice(0, 5),
    feed.slice(0, 5),
  );

  const bulletins = [
    ...homeFeed.slice(0, 4).map((item) => `${item.source}: ${item.title}`),
    "Gold pulse: bullion remains the cleanest live risk thermometer.",
    "Desk note: London + New York overlap still drives the strongest FX reaction.",
  ];

  const watchItems: WatchItem[] = [
    { name: "BTC", price: 68420, change: 2.4, timeframe: "1m · 5m · 4h", href: marketLinks.BTC },
    { name: "NIFTY 50", price: 23727.3, change: 0.33, timeframe: "1m · 5m · 1h", href: marketLinks["NIFTY 50"] },
    { name: "SENSEX", price: 75580.22, change: 0.35, timeframe: "1m · 5m · 1h", href: marketLinks.SENSEX },
    { name: "Gold", price: 2361.1, change: 1.1, timeframe: "1m · 5m · 1h", href: marketLinks.Gold },
    { name: "ETH", price: 3124, change: 1.7, timeframe: "1m · 5m · 4h", href: marketLinks.ETH },
    { name: "BANK NIFTY", price: 53626.4, change: 0.17, timeframe: "1m · 5m · 1h", href: marketLinks["BANK NIFTY"] },
    { name: "USD/INR", price: 83.18, change: -0.12, timeframe: "Spot · D", href: marketLinks["USD/INR"] },
    { name: "USD/JPY", price: 156.44, change: 0.08, timeframe: "Spot · D", href: marketLinks["USD/JPY"] },
    { name: "CRUDE", price: 79.42, change: 0.84, timeframe: "1m · 1h", href: marketLinks.CRUDE },
    { name: "SILVER", price: 31.12, change: 0.54, timeframe: "1m · 1h", href: marketLinks.SILVER },
    { name: "DXY", price: 104.62, change: -0.09, timeframe: "Spot · D", href: marketLinks.DXY },
  ];

  const todayFocusLinks = watchItems.slice(0, 6);
  const timelineStamp = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" });
  const todayLabel = now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
  const macroRows = buildMacroRows(category, activeTab);

  const sessionBars: SessionBar[] = [
    { label: "Sydney", local: "6:17 PM", start: 2, width: 25, tone: "bg-[#a7b4c8]" },
    { label: "Tokyo", local: "5:17 PM", start: 18, width: 28, tone: "bg-[#86cf56]" },
    { label: "London", local: "9:17 AM", start: 46, width: 24, tone: "bg-[#63b847]" },
    { label: "New York", local: "4:17 AM", start: 66, width: 28, tone: "bg-[#d3d8e1]" },
  ];

  const cryptoCards: CryptoCard[] = [
    {
      id: "market-cap",
      label: "Market Cap",
      value: "$2.55T",
      delta: "-0.62%",
      deltaTone: "text-[#ff7b52]",
      spark: [12, 8, 6, 7, 9, 8],
      bullets: ["Broad crypto capitalization cooled after a risk-off US session.", "BTC dominance stayed firm while smaller caps faded faster.", "Derivatives open interest remained stable despite the pullback."],
      takeaway: "Market cap is fading, but not in a panic structure yet.",
    },
    {
      id: "cmc20",
      label: "CMC20",
      value: "154.84",
      delta: "-0.68%",
      deltaTone: "text-[#ff7b52]",
      spark: [11, 7, 8, 9, 8, 7],
      bullets: ["Large-cap basket underperformed its prior 3-day bounce.", "Leaders are still doing better than tail-end altcoins.", "This remains a cleaner read on institutional-quality crypto appetite."],
      takeaway: "CMC20 says the big names are soft, but still leading the market.",
    },
    {
      id: "fear-greed",
      label: "Fear & Greed",
      value: "39",
      delta: "Fear",
      deltaTone: "text-[#fbbf24]",
      spark: [8, 9, 10, 8, 7, 8],
      bullets: ["Sentiment sits below neutral, so traders are still cautious.", "Fear this low often slows breakout attempts and favors mean reversion.", "If this rises above 50 while BTC holds, risk appetite usually broadens."],
      takeaway: "The market is cautious, not washed out.",
    },
    {
      id: "altcoin-season",
      label: "Altcoin Season",
      value: "33/100",
      delta: "BTC-led",
      deltaTone: "text-[#60a5fa]",
      spark: [9, 8, 7, 7, 6, 5],
      bullets: ["Altcoins are still lagging Bitcoin on a 7-day basis.", "Rotation is narrow and not yet a broad alt-season structure.", "Until this climbs above 50, BTC leadership is still the base case."],
      takeaway: "This is still a Bitcoin-led tape, not a real altcoin expansion.",
    },
    {
      id: "avg-rsi",
      label: "Average RSI",
      value: "41.31",
      delta: "Near oversold",
      deltaTone: "text-[#4ade80]",
      spark: [10, 10, 9, 8, 8, 7],
      bullets: ["Average RSI is leaning weak, but not fully capitulated.", "If RSI keeps slipping while volume falls, that often signals drift not panic.", "A rebound through the mid-40s would improve short-term momentum."],
      takeaway: "Momentum is weak, but close enough to support to watch for a bounce.",
    },
  ];
  const activeCryptoMetric = cryptoCards.find((card) => card.id === selectedCryptoMetric) ?? cryptoCards[0];

  const showCryptoMode = category === "Crypto" && activeTab === "Home";

  return (
    <main
      className={`${shellClass} min-h-screen px-3 py-3 md:px-4 ${isDark ? "bg-[#1f2026] text-[#e5e7eb]" : "bg-[#d9dde5] text-[#14233b]"}`}
    >
      <div
        className={`mx-auto max-w-[1680px] overflow-hidden rounded-[28px] border shadow-[0_28px_80px_rgba(4,12,24,0.35)] ${
          isDark ? "border-[#35271f] bg-[#22252d]" : "border-[#22375f] bg-[#cfd4dc]"
        }`}
      >
        <header className={`${isDark ? "border-b border-[#35271f] bg-[#252934] text-[#f3f4f6]" : "border-b border-[#5c769d] bg-[linear-gradient(180deg,#355286_0%,#233a63_52%,#1e2f4f_100%)] text-white"}`}>
          <div className="flex flex-col gap-3 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className={`flex h-14 w-14 items-center justify-center rounded-xl font-display text-xl font-bold tracking-[0.18em] ${isDark ? "bg-[#ff7b52]/10 text-[#ff9b78]" : "bg-white/10"}`}>
                MP
              </div>
              <div>
                <p className={`text-xs uppercase tracking-[0.35em] ${isDark ? "text-[#ffb08b]" : "text-sky-200/80"}`}>Market Pulse Atom</p>
                <h1 className="font-display text-3xl font-bold">Global Markets Desk</h1>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-[minmax(260px,1fr)_180px_150px]">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search hot stories, forex, macro, crypto"
                className={`rounded-lg border px-4 py-3 ${isDark ? "border-[#3f4458] bg-[#111521] text-white placeholder:text-slate-500" : "border-white/20 bg-[#10203d] text-white placeholder:text-slate-400"}`}
              />
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className={`rounded-lg border px-4 py-3 ${isDark ? "border-[#3f4458] bg-[#111521] text-white" : "border-white/20 bg-[#10203d] text-white"}`}
              >
                <option value="">All markets</option>
                <option value="Crypto">Crypto</option>
                <option value="Forex">Forex</option>
                <option value="Stocks">Stocks</option>
                <option value="Macroeconomics">Macroeconomics</option>
                <option value="Geopolitics">Geopolitics</option>
                <option value="Commodities">Commodities</option>
              </select>
              <button
                onClick={() => setThemeMode((current) => (current === "light" ? "dark" : "light"))}
                className={`rounded-lg border px-4 py-3 text-sm font-semibold ${isDark ? "border-[#6b4a36] bg-[#271d18] text-[#ffb08b]" : "border-white/20 bg-[#10203d] text-white"}`}
              >
                {isDark ? "☀ Light" : "☾ Dark"}
              </button>
            </div>
          </div>

          <div className={`border-y px-3 py-2 ${isDark ? "border-[#35271f] bg-[#1d2029]" : "border-white/10 bg-[#2c4572]"}`}>
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      setQuery("");
                    }}
                    className={`rounded-md border px-4 py-2 text-sm font-medium transition ${
                      activeTab === tab
                        ? `border-white/40 bg-gradient-to-r ${tabTheme[tab]} text-white`
                        : isDark
                          ? "border-transparent bg-white/5 text-slate-200 hover:border-[#ff7b52]/40"
                          : "border-transparent bg-white/8 text-slate-200 hover:border-white/20"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className={`flex items-center gap-4 rounded-md px-3 py-2 text-sm ${isDark ? "bg-[#111521] text-[#f1f5f9]" : "bg-[#1f355b] text-slate-100"}`}>
                <span className={`uppercase tracking-[0.25em] ${isDark ? "text-[#ffb08b]" : "text-sky-200/70"}`}>{todayLabel}</span>
                <span className="font-semibold">{timelineStamp}</span>
              </div>
            </div>
          </div>

          <div className={`grid gap-3 px-4 py-4 lg:grid-cols-[220px_minmax(0,1fr)_220px] ${isDark ? "border-t border-[#35271f] bg-[#1d2029] text-[#f3f4f6]" : "border-t border-[#496489] bg-[linear-gradient(180deg,#e8edf5_0%,#dfe5ed_100%)] text-[#1a3154]"}`}>
            <div className={`rounded-xl border p-3 ${isDark ? "border-[#3f4458] bg-[#111521]" : "border-[#9ab0cf] bg-white/80"}`}>
              <p className={`text-xs uppercase tracking-[0.3em] ${isDark ? "text-[#ffb08b]" : "text-[#53719a]"}`}>Asia FX Pulse</p>
              <div className="mt-3 space-y-3 text-sm">
                <div className={`flex items-center justify-between rounded-lg px-3 py-2 ${isDark ? "bg-[#1d2230]" : "bg-[#f5f8fc]"}`}>
                  <span>USD/INR</span>
                  <span className="font-semibold text-[#ff7b52]">83.18</span>
                </div>
                <div className={`flex items-center justify-between rounded-lg px-3 py-2 ${isDark ? "bg-[#1d2230]" : "bg-[#f5f8fc]"}`}>
                  <span>USD/JPY</span>
                  <span className="font-semibold text-[#4ade80]">156.44</span>
                </div>
                <div className={`flex items-center justify-between rounded-lg px-3 py-2 ${isDark ? "bg-[#1d2230]" : "bg-[#f5f8fc]"}`}>
                  <span>DXY</span>
                  <span className="font-semibold text-[#fbbf24]">104.62</span>
                </div>
              </div>
            </div>

            <div className={`rounded-xl border ${isDark ? "border-[#3f4458] bg-[#111521]" : "border-[#9ab0cf] bg-white/85"}`}>
              <div className={`border-b px-4 py-2 text-sm font-semibold ${isDark ? "border-[#2a3144] text-[#ffb08b]" : "border-[#b7c4d9] text-[#2a4b7f]"}`}>Global Market Indices</div>
              <div className={`grid grid-cols-2 gap-px md:grid-cols-4 ${isDark ? "bg-[#2a3144]" : "bg-[#b7c4d9]"}`}>
                {[
                  { name: "BTC", price: 68420, change: 2.4, href: marketLinks.BTC },
                  { name: "NIFTY 50", price: 23727.3, change: 0.33, href: marketLinks["NIFTY 50"] },
                  { name: "SENSEX", price: 75580.22, change: 0.35, href: marketLinks.SENSEX },
                  { name: "Gold", price: 2361.1, change: 1.1, href: marketLinks.Gold },
                ].map((mover) => (
                  <a key={mover.name} href={mover.href} target="_blank" rel="noreferrer" className={`px-4 py-3 transition ${isDark ? "bg-[#111521] hover:bg-[#171d2a]" : "bg-[#f8fbff] hover:bg-[#edf3fb]"}`}>
                    <p className={`text-xs uppercase tracking-[0.2em] ${isDark ? "text-slate-400" : "text-[#6c7f98]"}`}>{mover.name}</p>
                    <p className={`mt-2 text-2xl font-bold ${isDark ? "text-white" : "text-[#18345a]"}`}>{mover.price}</p>
                    <p className={`mt-1 text-sm ${mover.change >= 0 ? "text-[#4ade80]" : "text-[#ff7b52]"}`}>
                      {mover.change >= 0 ? "+" : ""}
                      {mover.change}%
                    </p>
                  </a>
                ))}
              </div>
            </div>

            <div className={`rounded-xl border p-3 ${isDark ? "border-[#3f4458] bg-[#111521]" : "border-[#9ab0cf] bg-white/80"}`}>
              <p className={`text-xs uppercase tracking-[0.3em] ${isDark ? "text-[#ffb08b]" : "text-[#53719a]"}`}>Gold Risk Sentiment</p>
              <div className="mt-3 space-y-3 text-sm">
                <div className={`flex items-center justify-between rounded-lg px-3 py-2 ${isDark ? "bg-[#201711]" : "bg-[#fff7e6]"}`}>
                  <span>Bias</span>
                  <span className="font-semibold text-[#fbbf24]">Bullish hedge</span>
                </div>
                <div className={`flex items-center justify-between rounded-lg px-3 py-2 ${isDark ? "bg-[#1d2230]" : "bg-[#f5f8fc]"}`}>
                  <span>Spot</span>
                  <span className="font-semibold">2361.1</span>
                </div>
                <div className={`flex items-center justify-between rounded-lg px-3 py-2 ${isDark ? "bg-[#132319]" : "bg-[#eefcf3]"}`}>
                  <span>Flow tone</span>
                  <span className="font-semibold text-[#4ade80]">Safe-haven bid</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className={`border-b px-4 py-2 ${isDark ? "border-[#35271f] bg-[#1d2029]" : "border-[#b0bccf] bg-[#eef2f7]"}`}>
          <div className={`flex overflow-hidden rounded-lg border ${isDark ? "border-[#3f4458] bg-[#111521]" : "border-[#b8c4d8] bg-white"}`}>
            <div className={`px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white ${isDark ? "bg-[#ff7b52]" : "bg-[#274674]"}`}>Bulletins</div>
            <div className="flex-1 overflow-hidden">
              <div className={`marquee flex min-w-max items-center gap-10 px-4 py-2 text-sm ${isDark ? "text-[#e5e7eb]" : "text-[#223a60]"}`}>
                {bulletins.map((item) => (
                  <span key={item} className="whitespace-nowrap">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className={`space-y-4 p-4 ${isDark ? "bg-[#1a1d25]" : "bg-[linear-gradient(180deg,#dbe1e8_0%,#d1d8e1_100%)]"}`}>
          <div className="grid gap-4 xl:grid-cols-4">
            <section className="desk-card overflow-hidden">
              <div className={`desk-title text-white ${isDark ? "bg-[#ff7b52]" : "bg-[#203c66]"}`}>Hot Pulse</div>
              <div className={`space-y-3 p-4 ${isDark ? "bg-[#111521]" : "bg-[#f7f9fc]"}`}>
                {hotPulse.map((article) => (
                  <a key={article.id} href={safeHref(article)} target="_blank" rel="noreferrer" className={`block rounded-lg border px-3 py-3 ${isDark ? "border-[#31384d] bg-[#171d2a] hover:bg-[#1d2534]" : "border-[#d4dbe6] bg-white hover:bg-[#eef4fb]"}`}>
                    <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-[#21406d]"}`}>{article.title}</p>
                    <p className={`mt-1 text-xs uppercase tracking-[0.18em] ${isDark ? "text-slate-400" : "text-[#73839b]"}`}>
                      {article.source} · {relativeTime(article.published_at)}
                    </p>
                  </a>
                ))}
              </div>
            </section>

            <section className="desk-card overflow-hidden">
              <div className={`desk-title text-white ${isDark ? "bg-[#2b3144]" : "bg-[#3f5f93]"}`}>Sessions</div>
              <div className={`${isDark ? "bg-[#111521]" : "bg-[#eef3f8]"} p-4`}>
                <div className={`mb-3 flex items-center justify-between rounded-lg px-3 py-2 text-xs uppercase tracking-[0.25em] ${isDark ? "bg-[#171d2a] text-[#ffb08b]" : "bg-white text-[#355286]"}`}>
                  <span>Asia</span>
                  <span>Europe</span>
                  <span>US</span>
                </div>
                <div className={`relative rounded-xl border px-4 py-4 ${isDark ? "border-[#31384d] bg-[#171d2a]" : "border-[#c2cede] bg-white"}`}>
                  <div className={`absolute inset-y-4 w-[3px] ${isDark ? "bg-[#ff7b52]" : "bg-[#6bcf55]"}`} style={{ left: "50%" }} />
                  <div className="space-y-3">
                    {sessionBars.map((bar) => (
                      <div key={bar.label} className={`relative h-9 rounded-full ${isDark ? "bg-[#0f141f]" : "bg-[#eef2f6]"}`}>
                        <div
                          className={`absolute top-1/2 h-7 -translate-y-1/2 rounded-full px-3 text-sm font-semibold leading-7 text-[#1d2433] ${bar.tone}`}
                          style={{ left: `${bar.start}%`, width: `${bar.width}%` }}
                        >
                          {bar.label}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className={`mt-3 grid grid-cols-2 gap-2 text-sm ${isDark ? "text-slate-300" : "text-[#28466f]"}`}>
                    <div>Tokyo: 5:17 PM</div>
                    <div>London: 9:17 AM</div>
                    <div>Sydney: 6:17 PM</div>
                    <div>New York: 4:17 AM</div>
                  </div>
                </div>
              </div>
            </section>

            <section className="desk-card overflow-hidden">
              <div className={`desk-title text-white ${isDark ? "bg-[#2b7644]" : "bg-[#1f8f51]"}`}>Today Major 2 Pinned</div>
              <div className={`${isDark ? "bg-[#111a14]" : "bg-[#f7fff9]"} space-y-3 p-4`}>
                {pinnedToday.map((article) => (
                  <a key={article.id} href={safeHref(article)} target="_blank" rel="noreferrer" className={`block rounded-lg border px-3 py-3 ${isDark ? "border-[#2d5238] bg-[#18251e] hover:bg-[#1d2e25]" : "border-[#cae8d4] bg-white hover:bg-[#eefbf1]"}`}>
                    <p className={`text-xs uppercase tracking-[0.2em] ${isDark ? "text-[#96c9a8]" : "text-[#6f829a]"}`}>{article.source} · {relativeTime(article.published_at)}</p>
                    <p className={`mt-2 font-display text-xl font-bold leading-tight ${isDark ? "text-white" : "text-[#21406d]"}`}>{article.title}</p>
                    <p className={`mt-2 text-sm leading-6 ${isDark ? "text-slate-300" : "text-[#5d7087]"}`}>{excerptText(article, 170)}</p>
                  </a>
                ))}
              </div>
            </section>

            <section className="desk-card overflow-hidden">
              <div className={`desk-title text-white ${isDark ? "bg-[#5d2a22]" : "bg-[#a53a6f]"}`}>Hot Story</div>
              <div className={`${isDark ? "bg-[#17131b]" : "bg-[#fff6fb]"} space-y-3 p-4`}>
                <p className={`font-display text-2xl font-bold leading-tight ${isDark ? "text-white" : "text-[#21406d]"}`}>{hotStory.title}</p>
                <p className={`text-sm ${isDark ? "text-slate-400" : "text-[#5f718a]"}`}>
                  {hotStory.source} · {relativeTime(hotStory.published_at)} · {hotStory.sentiment_label}
                </p>
                <p className={`text-[15px] leading-7 ${isDark ? "text-slate-300" : "text-[#233a60]"}`}>{excerptText(hotStory, 320)}</p>
              </div>
            </section>
          </div>

          {showCryptoMode ? (
            <div className="space-y-4">
              <section className="desk-card overflow-hidden">
                <div className="desk-title bg-[#1f2430] text-white">Crypto 7D Analytics</div>
                <div className="grid gap-4 bg-[#0f1522] p-4 md:grid-cols-2 xl:grid-cols-5">
                  {cryptoCards.map((card, index) => (
                    <button
                      key={card.label}
                      type="button"
                      onClick={() => setSelectedCryptoMetric(card.id)}
                      className={`rounded-2xl border p-4 text-left text-white transition ${
                        selectedCryptoMetric === card.id
                          ? "border-[#ff7b52] bg-[#202635] shadow-[0_0_0_1px_rgba(255,123,82,0.28)]"
                          : "border-white/10 bg-[#1a1f2b] hover:border-[#3d455a]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm text-slate-400">{card.label}</p>
                          <p className="mt-2 text-4xl font-bold">{card.value}</p>
                          <p className={`mt-1 text-sm ${card.deltaTone}`}>{card.delta}</p>
                        </div>
                        <span className="rounded-full bg-white/5 px-2 py-1 text-xs text-slate-300">7D</span>
                      </div>
                      <div className="mt-4">
                        {index === 0 || index === 4 ? (
                          <MetricBars points={card.spark} colorClass={index === 0 ? "bg-[#ff7b52]" : "bg-[#60a5fa]"} />
                        ) : (
                          <Sparkline points={card.spark} colorClass={index < 2 ? "text-[#ff7b52]" : "text-[#60a5fa]"} />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
                <section className="desk-card overflow-hidden">
                  <div className="desk-title bg-[#36261f] text-white">{activeCryptoMetric.label} Breakdown</div>
                  <div className="grid gap-4 bg-[#111521] p-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(260px,0.65fr)]">
                    <div className="rounded-2xl border border-[#31384d] bg-[#171d2a] p-5 text-white">
                      <div className="flex items-end justify-between gap-4">
                        <div>
                          <p className="text-sm uppercase tracking-[0.18em] text-[#ffb08b]">{activeCryptoMetric.label}</p>
                          <p className="mt-2 text-5xl font-bold">{activeCryptoMetric.value}</p>
                          <p className={`mt-2 text-sm ${activeCryptoMetric.deltaTone}`}>{activeCryptoMetric.delta}</p>
                        </div>
                        <div className="w-40">
                          <MetricBars points={activeCryptoMetric.spark} colorClass="bg-[#ff7b52]" />
                        </div>
                      </div>
                      <p className="mt-5 text-lg leading-8 text-slate-200">{activeCryptoMetric.takeaway}</p>
                    </div>
                    <div className="rounded-2xl border border-[#31384d] bg-[#171d2a] p-5 text-slate-200">
                      <p className="text-sm uppercase tracking-[0.18em] text-[#ffb08b]">What To Know</p>
                      <div className="mt-4 space-y-3">
                        {activeCryptoMetric.bullets.map((item) => (
                          <div key={item} className="rounded-xl border border-[#3a4154] bg-[#1f2533] px-4 py-3 leading-7">
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                <section className="desk-card overflow-hidden">
                  <div className="desk-title bg-[#24344f] text-white">Crypto Hot Stories</div>
                  <div className="divide-y divide-[#c7d1df] bg-[#f7f9fc]">
                    {latestStories.slice(0, 6).map((article) => (
                      <a key={article.id} href={safeHref(article)} target="_blank" rel="noreferrer" className="grid gap-2 px-4 py-3 hover:bg-[#edf3fb] md:grid-cols-[minmax(0,1fr)_120px]">
                        <div>
                          <p className="font-semibold text-[#224371]">{article.title}</p>
                          <p className="mt-1 text-sm text-[#64748b]">{article.source} · {relativeTime(article.published_at)}</p>
                        </div>
                        <div className="text-right text-xs uppercase tracking-[0.2em] text-[#73839b]">{article.category}</div>
                      </a>
                    ))}
                  </div>
                </section>

                <section className="desk-card overflow-hidden">
                  <div className="desk-title bg-[#36558b] text-white">Trending Radar</div>
                  <div className="space-y-3 bg-[#f7f9fc] p-4">
                    {latestStories.slice(0, 5).map((article) => (
                      <a key={article.id} href={safeHref(article)} target="_blank" rel="noreferrer" className="block rounded-lg border border-[#cad4e2] bg-white p-3 hover:bg-[#eef4fb]">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold text-[#23416c]">{article.title}</p>
                          <span className="rounded-full bg-[#edf4ff] px-2 py-1 text-xs text-[#28518a]">{article.sentiment_label}</span>
                        </div>
                        <p className="mt-2 text-sm text-[#64748b]">{article.source}</p>
                      </a>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
              <div className="space-y-4">
                {activeTab === "Home" ? (
                  <>
                    <section className="desk-card overflow-hidden">
                      <div className={`desk-title text-white ${isDark ? "bg-[#2b3144]" : "bg-[#36558b]"}`}>Trending Radar</div>
                      <div className={`grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3 ${isDark ? "bg-[#111521]" : "bg-[#f7f9fc]"}`}>
                        {trendingStories.map((article) => (
                          <a key={article.id} href={safeHref(article)} target="_blank" rel="noreferrer" className={`rounded-xl border p-4 ${isDark ? "border-[#31384d] bg-[#171d2a]" : "border-[#cad4e2] bg-white"}`}>
                            <p className={`font-semibold ${isDark ? "text-white" : "text-[#23416c]"}`}>{article.title}</p>
                            <p className={`mt-2 text-sm ${isDark ? "text-slate-400" : "text-[#64748b]"}`}>{article.source}</p>
                          </a>
                        ))}
                      </div>
                    </section>

                    <div className="grid gap-4 xl:grid-cols-3">
                      <section className="desk-card overflow-hidden">
                        <div className="desk-title bg-[#f59e0b] text-white">Yesterday Focus</div>
                        <div className={`${isDark ? "bg-[#22170f]" : "bg-[#fff9ef]"} space-y-3 p-4`}>
                          {yesterdayStories.map((article) => (
                            <a
                              key={article.id}
                              href={safeHref(article)}
                              target="_blank"
                              rel="noreferrer"
                              className={`block rounded-lg border px-3 py-3 transition ${isDark ? "border-[#5c4428] bg-[#261b13] hover:bg-[#322317]" : "border-[#efd9ab] bg-white hover:bg-[#fff3d7]"}`}
                            >
                              <p className={`font-semibold ${isDark ? "text-white" : "text-[#23416c]"}`}>{article.title}</p>
                              <p className={`mt-1 text-sm ${isDark ? "text-slate-400" : "text-[#6b7d94]"}`}>{article.source}</p>
                            </a>
                          ))}
                        </div>
                      </section>

                      <section className="desk-card overflow-hidden">
                        <div className="desk-title bg-[#6d5efc] text-white">Weekly Focus</div>
                        <div className={`${isDark ? "bg-[#171327]" : "bg-[#f6f3ff]"} space-y-3 p-4`}>
                          {weeklyStories.map((article) => (
                            <a
                              key={article.id}
                              href={safeHref(article)}
                              target="_blank"
                              rel="noreferrer"
                              className={`block rounded-lg border px-3 py-3 transition ${isDark ? "border-[#413a69] bg-[#1f1a33] hover:bg-[#2a2142]" : "border-[#d9d2ff] bg-white hover:bg-[#f2ecff]"}`}
                            >
                              <p className={`font-semibold ${isDark ? "text-white" : "text-[#23416c]"}`}>{article.title}</p>
                              <p className={`mt-1 text-sm ${isDark ? "text-slate-400" : "text-[#6b7d94]"}`}>{article.source}</p>
                            </a>
                          ))}
                        </div>
                      </section>

                      <section className="desk-card overflow-hidden">
                        <div className="desk-title bg-[#db2777] text-white">Monthly Focus</div>
                        <div className={`${isDark ? "bg-[#24131b]" : "bg-[#fff1f7]"} space-y-3 p-4`}>
                          {monthlyStories.map((article) => (
                            <a
                              key={article.id}
                              href={safeHref(article)}
                              target="_blank"
                              rel="noreferrer"
                              className={`block rounded-lg border px-3 py-3 transition ${isDark ? "border-[#603149] bg-[#2a1822] hover:bg-[#3a1d2b]" : "border-[#f1c7db] bg-white hover:bg-[#ffe4f0]"}`}
                            >
                              <p className={`font-semibold ${isDark ? "text-white" : "text-[#23416c]"}`}>{article.title}</p>
                              <p className={`mt-1 text-sm ${isDark ? "text-slate-400" : "text-[#6b7d94]"}`}>{article.source}</p>
                            </a>
                          ))}
                        </div>
                      </section>
                    </div>
                  </>
                ) : (
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
                    <section className="desk-card overflow-hidden">
                      <div className={`desk-title bg-gradient-to-r ${tabTheme[activeTab]} text-white`}>{`${activeTab} Stories`}</div>
                      <div className={`divide-y ${isDark ? "divide-[#31384d] bg-[#111521]" : "divide-[#c7d1df] bg-[#f7f9fc]"}`}>
                        <div className={`px-4 py-3 text-sm ${isDark ? "bg-[#171d2a] text-[#ffb08b]" : "bg-white text-[#476384]"}`}>
                          {tabLabels[activeTab]}: showing only the {activeTab.toLowerCase()} feed instead of the front-page blend.
                        </div>
                        {latestStories.map((article) => (
                          <a key={article.id} href={safeHref(article)} target="_blank" rel="noreferrer" className={`grid gap-2 px-4 py-3 md:grid-cols-[minmax(0,1fr)_120px] ${isDark ? "hover:bg-[#171d2a]" : "hover:bg-[#edf3fb]"}`}>
                            <div>
                              <p className={`font-semibold ${isDark ? "text-white" : "text-[#224371]"}`}>{article.title}</p>
                              <p className={`mt-1 text-sm ${isDark ? "text-slate-400" : "text-[#64748b]"}`}>From {article.source} · {relativeTime(article.published_at)}</p>
                            </div>
                            <div className={`text-right text-xs uppercase tracking-[0.2em] ${isDark ? "text-slate-500" : "text-[#73839b]"}`}>{article.category}</div>
                          </a>
                        ))}
                      </div>
                    </section>

                    <section className="desk-card overflow-hidden">
                      <div className={`desk-title text-white ${isDark ? "bg-[#2b3144]" : "bg-[#284c80]"}`}>{activeTab} Focus</div>
                      <div className={`${isDark ? "bg-[#111521]" : "bg-[#f7f9fc]"} space-y-3 p-4`}>
                        {hotStory ? (
                          <>
                            <p className={`font-display text-[2rem] font-bold leading-tight ${isDark ? "text-white" : "text-[#21406d]"}`}>{hotStory.title}</p>
                            <p className={`text-sm ${isDark ? "text-slate-400" : "text-[#5f718a]"}`}>
                              From {hotStory.source} · {relativeTime(hotStory.published_at)} · {hotStory.sentiment_label}
                            </p>
                            <p className={`text-[15px] leading-7 ${isDark ? "text-slate-300" : "text-[#233a60]"}`}>{excerptText(hotStory, 320)}</p>
                          </>
                        ) : (
                          <p className={`text-sm ${isDark ? "text-slate-400" : "text-[#5f718a]"}`}>No major stories available for this filter yet.</p>
                        )}
                      </div>
                    </section>
                  </div>
                )}
              </div>

              <aside className="space-y-4">
                <section className="desk-card overflow-hidden">
                  <div className={`desk-title text-white ${isDark ? "bg-[#36261f]" : "bg-[#2f568e]"}`}>{activeTab === "Home" ? "Global Hot Stories" : `${activeTab} Radar`}</div>
                  <div className={`${isDark ? "bg-[#111521]" : "bg-[#f7f9fc]"} space-y-3 p-4`}>
                    {globalStories.slice(0, 5).map((article) => (
                      <a key={article.id} href={safeHref(article)} target="_blank" rel="noreferrer" className={`block rounded-lg border p-3 ${isDark ? "border-[#31384d] bg-[#171d2a] hover:bg-[#1d2534]" : "border-[#cad4e2] bg-white hover:bg-[#eef4fb]"}`}>
                        <p className={`font-semibold ${isDark ? "text-white" : "text-[#23416c]"}`}>{article.title}</p>
                        <p className={`mt-2 text-sm ${isDark ? "text-slate-400" : "text-[#64748b]"}`}>{article.source} · {relativeTime(article.published_at)}</p>
                      </a>
                    ))}
                  </div>
                </section>

                <section className="desk-card overflow-hidden">
                  <div className={`desk-title text-white ${isDark ? "bg-[#2b3144]" : "bg-[#36558b]"}`}>Today Focus</div>
                  <div className={`${isDark ? "bg-[#111521]" : "bg-[#f7f9fc]"} space-y-3 p-4`}>
                    {todayFocusLinks.map((mover) => (
                      <a key={mover.name} href={mover.href} target="_blank" rel="noreferrer" className={`flex items-center justify-between rounded-lg border px-3 py-3 ${isDark ? "border-[#31384d] bg-[#171d2a] hover:bg-[#1d2534]" : "border-[#cad4e2] bg-white hover:bg-[#eef4fb]"}`}>
                        <div>
                          <p className={`font-semibold ${isDark ? "text-white" : "text-[#24406a]"}`}>{mover.name}</p>
                          <p className={`text-sm ${isDark ? "text-slate-400" : "text-[#6b7d94]"}`}>{mover.timeframe}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${isDark ? "text-white" : "text-[#1d3557]"}`}>{mover.price}</p>
                          <p className={mover.change >= 0 ? "text-[#4ade80]" : "text-[#ff7b52]"}>
                            {mover.change >= 0 ? "+" : ""}
                            {mover.change}%
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                </section>
              </aside>
            </div>
          )}
        </section>

        <section className={`border-t p-4 ${isDark ? "border-[#35271f] bg-[#1d2029]" : "border-[#aebacf] bg-[#e7ebf1]"}`}>
          <div className="desk-card overflow-hidden">
            <div className={`desk-title text-white ${isDark ? "bg-[#2b3144]" : "bg-[#36558b]"}`}>Today&apos;s Timeline & Macro Calendar</div>
            <div className={`overflow-x-auto ${isDark ? "bg-[#111521]" : "bg-[#f8fbff]"}`}>
              <table className="min-w-full text-left text-sm">
                <thead className={`${isDark ? "bg-[#171d2a] text-[#ffb08b]" : "bg-[#dbe5f3] text-[#274574]"}`}>
                  <tr>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Region</th>
                    <th className="px-4 py-3">Impact</th>
                    <th className="px-4 py-3">Event</th>
                    <th className="px-4 py-3">Actual</th>
                    <th className="px-4 py-3">Forecast</th>
                    <th className="px-4 py-3">Previous</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? "divide-[#31384d] text-[#e5e7eb]" : "divide-[#d8e0eb] text-[#223a60]"}`}>
                  {macroRows.map((row) => (
                    <tr key={row.join("-")}>
                      {row.map((cell, index) => (
                        <td key={`${row[0]}-${index}`} className="px-4 py-3">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
