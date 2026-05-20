import { useState, useMemo, useCallback } from "react";
import MapView from "@/components/MapView";
import GlobalLocationSelector, { GeoPoint } from "@/components/GlobalLocationSelector";
import InputPanel from "@/components/InputPanel";
import RouteComparisonTable from "@/components/RouteComparisonTable";
import RouteCards from "@/components/RouteCards";
import SmartSuggestions from "@/components/SmartSuggestions";
import WelcomeBanner from "@/components/WelcomeBanner";
import { calculateCost, formatCurrency } from "@/lib/costCalculator";
import { generateRoutes, RouteType } from "@/lib/routeAnalyzer";

const MapPage = () => {
  const [source, setSource] = useState<GeoPoint | null>(null);
  const [destination, setDestination] = useState<GeoPoint | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [mapZoom, setMapZoom] = useState<number>(3);

  const [premises, setPremises] = useState(500);
  const [workers, setWorkers] = useState(10);
  const [wagePerDay, setWagePerDay] = useState(800);
  const [workingDays, setWorkingDays] = useState(30);
  const [deploymentType, setDeploymentType] = useState<"underground" | "aerial">("underground");
  const [arpu, setArpu] = useState(500);
  const [selectedRoute, setSelectedRoute] = useState<RouteType | null>(null);

  const handleSource = (p: GeoPoint | null) => {
    setSource(p);
    setSelectedRoute(null);
    if (p) setMapCenter({ lat: p.lat, lng: p.lng });
  };
  const handleDestination = (p: GeoPoint | null) => {
    setDestination(p);
    setSelectedRoute(null);
    if (p) setMapCenter({ lat: p.lat, lng: p.lng });
  };

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      if (!source) setSource({ lat, lng });
      else if (!destination) setDestination({ lat, lng });
      else {
        setSource(null);
        setDestination(null);
        setSelectedRoute(null);
      }
    },
    [source, destination]
  );

  const result = useMemo(
    () => calculateCost({ source, destination, premisesCount: premises, workers, wagePerDay, workingDays, deploymentType, arpu }),
    [source, destination, premises, workers, wagePerDay, workingDays, deploymentType, arpu]
  );

  const routeAnalysis = useMemo(() => {
    if (!source || !destination) return null;
    return generateRoutes(source, destination, premises, arpu);
  }, [source, destination, premises, arpu]);

  const handleRouteSelect = (type: RouteType) => setSelectedRoute((prev) => (prev === type ? null : type));

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <WelcomeBanner />

      <div>
        <h2 className="text-xl font-bold text-foreground">Global Route Planning</h2>
        <p className="text-sm text-muted-foreground">
          Plan fiber routes anywhere on Earth — search any place, pick from country/state/city dropdowns, or click on the map.
        </p>
      </div>

      <GlobalLocationSelector
        source={source}
        destination={destination}
        onSourceChange={handleSource}
        onDestinationChange={handleDestination}
        onCenterChange={(c) => {
          setMapCenter({ lat: c.lat, lng: c.lng });
          if (c.zoom) setMapZoom(c.zoom);
        }}
      />

      <MapView
        source={source}
        destination={destination}
        onMapClick={handleMapClick}
        center={mapCenter}
        zoom={mapZoom}
        routes={routeAnalysis?.routes}
        selectedRoute={selectedRoute}
        onRouteClick={handleRouteSelect}
      />

      <InputPanel
        source={source}
        destination={destination}
        premises={premises}
        onPremisesChange={setPremises}
        distance={result?.distance ?? null}
        workers={workers}
        onWorkersChange={setWorkers}
        wagePerDay={wagePerDay}
        onWageChange={setWagePerDay}
        workingDays={workingDays}
        onWorkingDaysChange={setWorkingDays}
        deploymentType={deploymentType}
        onDeploymentTypeChange={setDeploymentType}
        arpu={arpu}
        onArpuChange={setArpu}
      />

      {routeAnalysis && (
        <>
          <RouteCards
            routes={routeAnalysis.routes}
            bestRoute={routeAnalysis.best_route}
            bestReason={routeAnalysis.best_reason}
            selectedRoute={selectedRoute}
            onSelectRoute={handleRouteSelect}
          />
          <RouteComparisonTable
            routes={routeAnalysis.routes}
            bestRoute={routeAnalysis.best_route}
            onSelectRoute={handleRouteSelect}
            selectedRoute={selectedRoute}
          />
          <SmartSuggestions
            routes={routeAnalysis.routes}
            bestRoute={routeAnalysis.best_route}
            deploymentType={deploymentType}
          />
        </>
      )}

      {result && (
        <div className="glass-card p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Distance", value: `${result.distance.toFixed(1)} km`, color: "text-primary" },
            { label: "Total Cost", value: formatCurrency(result.totalCost), color: "text-foreground" },
            { label: "Terrain", value: `${result.terrain} (${result.terrainMultiplier}x)`, color: result.terrain === "hilly" ? "text-warning" : "text-primary" },
            { label: "Duration", value: `${result.durationDays} days`, color: "text-info" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{s.label}</p>
              <p className={`text-lg font-bold font-mono ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MapPage;
