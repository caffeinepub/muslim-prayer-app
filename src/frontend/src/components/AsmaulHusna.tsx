import { Input } from "@/components/ui/input";
import { Search, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { asmaUlHusna } from "../data/asmaUlHusna";

export default function AsmaulHusna() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return asmaUlHusna;
    return asmaUlHusna.filter(
      (n) =>
        n.meaning.toLowerCase().includes(q) ||
        n.transliteration.toLowerCase().includes(q) ||
        n.arabic.includes(q) ||
        String(n.number).includes(q),
    );
  }, [search]);

  return (
    <div className="flex flex-col px-4 py-4">
      {/* Header */}
      <div className="text-center mb-5">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Sparkles size={16} className="text-orange-500" />
          <h2 className="text-xl font-display font-bold text-gradient-orange">
            Асма уль-Хусна
          </h2>
          <Sparkles size={16} className="text-orange-500" />
        </div>
        <p className="text-foreground/40 text-xs">99 прекрасных имён Аллаха</p>
        <div
          className="text-2xl mt-2 text-foreground/20"
          style={{ fontFamily: "serif", direction: "rtl" }}
        >
          وَلِلَّهِ الْأَسْمَاءُ الْحُسْنَىٰ
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30"
        />
        <Input
          placeholder="Поиск по имени или значению..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-secondary border-border text-foreground placeholder:text-foreground/30 text-sm"
          data-ocid="names.search_input"
        />
      </div>

      {/* Count */}
      <div className="text-xs text-foreground/30 mb-3 text-right">
        {filtered.length} из 99
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div
          className="text-center py-12 text-foreground/30"
          data-ocid="names.empty_state"
        >
          <div className="text-3xl mb-2">🔍</div>
          <p className="text-sm">Ничего не найдено</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 pb-4">
          {filtered.map((name, idx) => (
            <div
              key={name.number}
              className="glass-card rounded-xl p-3 text-center relative overflow-hidden group hover:border-orange-500/30 transition-all duration-200 cursor-default"
              style={{ animationDelay: `${(idx % 12) * 0.04}s` }}
            >
              {/* Number badge */}
              <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-orange-500/15 flex items-center justify-center">
                <span className="text-[9px] font-bold text-orange-500/70">
                  {name.number}
                </span>
              </div>

              {/* Arabic text */}
              <div
                className="text-xl font-bold text-foreground mb-1 leading-relaxed mt-1"
                style={{ direction: "rtl", fontFamily: "serif" }}
              >
                {name.arabic}
              </div>

              {/* Separator */}
              <div className="w-8 h-px bg-orange-500/20 mx-auto mb-1.5" />

              {/* Transliteration */}
              <div className="text-orange-400 text-xs font-medium mb-0.5 truncate">
                {name.transliteration}
              </div>

              {/* Meaning */}
              <div className="text-foreground/50 text-[11px] leading-tight">
                {name.meaning}
              </div>

              {/* Hover glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-orange-500/0 group-hover:from-orange-500/5 group-hover:to-transparent transition-all duration-300 pointer-events-none rounded-xl" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
