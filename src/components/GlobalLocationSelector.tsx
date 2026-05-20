import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, MapPin, Loader2 } from "lucide-react";
import { Country, State, City } from "country-state-city";

export interface GeoPoint {
  lat: number;
  lng: number;
  label?: string;
}

interface Props {
  source: GeoPoint | null;
  destination: GeoPoint | null;
  onSourceChange: (p: GeoPoint | null) => void;
  onDestinationChange: (p: GeoPoint | null) => void;
  onCenterChange?: (p: { lat: number; lng: number; zoom?: number }) => void;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

const useDebounced = <T,>(value: T, delay = 350) => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
};

const SelectField = ({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  disabled?: boolean;
}) => (
  <div className="relative">
    <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium block mb-1.5">{label}</label>
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full appearance-none bg-muted/60 text-sm text-foreground rounded-lg px-3 py-2.5 pr-8 border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
    </div>
  </div>
);

const SearchBox = ({
  label,
  placeholder,
  onPick,
  color,
}: {
  label: string;
  placeholder: string;
  onPick: (p: GeoPoint) => void;
  color: "green" | "red";
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounced = useDebounced(query, 400);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let aborted = false;
    if (!debounced || debounced.length < 3) {
      setResults([]);
      return;
    }
    setLoading(true);
    fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=6&q=${encodeURIComponent(debounced)}`, {
      headers: { Accept: "application/json" },
    })
      .then((r) => r.json())
      .then((data: NominatimResult[]) => {
        if (!aborted) setResults(data || []);
      })
      .catch(() => !aborted && setResults([]))
      .finally(() => !aborted && setLoading(false));
    return () => {
      aborted = true;
    };
  }, [debounced]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const dotClass = color === "green" ? "bg-emerald-500" : "bg-red-500";

  return (
    <div ref={wrapperRef} className="relative">
      <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1.5 flex items-center gap-1.5">
        <span className={`inline-block w-2 h-2 rounded-full ${dotClass}`} />
        {label}
      </label>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="w-full bg-muted/60 text-sm text-foreground rounded-lg pl-8 pr-8 py-2.5 border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
        />
        {loading && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />}
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-h-72 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg">
          {results.map((r) => (
            <button
              type="button"
              key={r.place_id}
              onClick={() => {
                onPick({ lat: parseFloat(r.lat), lng: parseFloat(r.lon), label: r.display_name });
                setQuery(r.display_name);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-xs hover:bg-accent flex items-start gap-2 border-b border-border/40 last:border-b-0"
            >
              <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <span className="text-foreground leading-snug">{r.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const GlobalLocationSelector = ({ source, destination, onSourceChange, onDestinationChange, onCenterChange }: Props) => {
  const [countryCode, setCountryCode] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [cityName, setCityName] = useState("");

  const countries = useMemo(() => Country.getAllCountries(), []);
  const states = useMemo(() => (countryCode ? State.getStatesOfCountry(countryCode) : []), [countryCode]);
  const cities = useMemo(
    () => (countryCode && stateCode ? City.getCitiesOfState(countryCode, stateCode) : []),
    [countryCode, stateCode]
  );

  const handleCountry = (code: string) => {
    setCountryCode(code);
    setStateCode("");
    setCityName("");
    const c = countries.find((x) => x.isoCode === code);
    if (c && c.latitude && c.longitude && onCenterChange) {
      onCenterChange({ lat: parseFloat(c.latitude), lng: parseFloat(c.longitude), zoom: 5 });
    }
  };

  const handleState = (code: string) => {
    setStateCode(code);
    setCityName("");
    const s = states.find((x) => x.isoCode === code);
    if (s && s.latitude && s.longitude && onCenterChange) {
      onCenterChange({ lat: parseFloat(s.latitude), lng: parseFloat(s.longitude), zoom: 7 });
    }
  };

  const handleCity = (name: string) => {
    setCityName(name);
    const c = cities.find((x) => x.name === name);
    if (c && c.latitude && c.longitude && onCenterChange) {
      onCenterChange({ lat: parseFloat(c.latitude), lng: parseFloat(c.longitude), zoom: 11 });
    }
  };

  return (
    <div className="glass-card p-5 space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SelectField
          label="Country"
          value={countryCode}
          onChange={handleCountry}
          placeholder="Select Country"
          options={countries.map((c) => ({ value: c.isoCode, label: `${c.flag ?? ""} ${c.name}` }))}
        />
        <SelectField
          label="State / Province"
          value={stateCode}
          onChange={handleState}
          placeholder={countryCode ? "Select State" : "Pick country first"}
          disabled={!countryCode}
          options={states.map((s) => ({ value: s.isoCode, label: s.name }))}
        />
        <SelectField
          label="City"
          value={cityName}
          onChange={handleCity}
          placeholder={stateCode ? "Select City" : "Pick state first"}
          disabled={!stateCode}
          options={cities.map((c) => ({ value: c.name, label: c.name }))}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SearchBox
          label="Source Location"
          placeholder="Search any address, city, place..."
          color="green"
          onPick={onSourceChange}
        />
        <SearchBox
          label="Destination Location"
          placeholder="Search any address, city, place..."
          color="red"
          onPick={onDestinationChange}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
        <div className="px-3 py-2 rounded-lg bg-muted/50 border border-border flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-muted-foreground">Source:</span>
          <span className="font-mono text-foreground truncate">
            {source ? source.label ?? `${source.lat.toFixed(4)}, ${source.lng.toFixed(4)}` : "Not set"}
          </span>
        </div>
        <div className="px-3 py-2 rounded-lg bg-muted/50 border border-border flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
          <span className="text-muted-foreground">Destination:</span>
          <span className="font-mono text-foreground truncate">
            {destination ? destination.label ?? `${destination.lat.toFixed(4)}, ${destination.lng.toFixed(4)}` : "Not set"}
          </span>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Tip: use the dropdowns to zoom the map, the search boxes for precise addresses, or click directly on the map to set source &amp; destination.
      </p>
    </div>
  );
};

export default GlobalLocationSelector;
