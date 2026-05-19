type Props = {
  query: string;
  setQuery: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
};

const categories = ["", "Crypto", "Forex", "Stocks", "Commodities", "Macroeconomics", "Geopolitics", "Central Banks"];

export function SearchPanel({ query, setQuery, category, setCategory }: Props) {
  return (
    <div className="panel p-5">
      <div className="flex flex-col gap-3 lg:flex-row">
        <input
          className="flex-1 rounded-2xl border border-line bg-slate-950/70 px-4 py-3 text-white outline-none ring-0 placeholder:text-slate-500"
          placeholder="Search keywords, coins, tickers, macro themes"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select
          className="rounded-2xl border border-line bg-slate-950/70 px-4 py-3 text-white outline-none"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          {categories.map((item) => (
            <option key={item || "all"} value={item}>
              {item || "All categories"}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

