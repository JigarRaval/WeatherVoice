import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getMapConfig, API_URL } from '../services/api';

const LEGENDS = {
  radar: {
    label: 'Precipitation intensity',
    stops: ['#00d4ff', '#00ff00', '#ffff00', '#ff7f00', '#ff0000', '#b400b4'],
  },
  precipitation: {
    label: 'Precipitation intensity',
    stops: ['#00d4ff', '#00ff00', '#ffff00', '#ff7f00', '#ff0000'],
  },
  clouds: {
    label: 'Cloud cover',
    stops: ['rgba(255,255,255,0.2)', 'rgba(200,200,200,0.5)', 'rgba(140,140,140,0.75)', 'rgba(80,80,80,0.9)'],
  },
  temperature: {
    label: 'Temperature',
    stops: ['#313695', '#4575b4', '#74add1', '#fee090', '#f46d43', '#a50026'],
  },
  wind: {
    label: 'Wind speed',
    stops: ['#e0f3f8', '#abd9e9', '#74add1', '#4575b4', '#313695'],
  },
};

function Legend({ layerId }) {
  const legend = LEGENDS[layerId];
  if (!legend) return null;
  return (
    <div className="absolute bottom-3 left-3 bg-white/95 rounded shadow p-2 text-xs z-[1000]">
      <p className="font-semibold text-gray-700 mb-1">{legend.label}</p>
      <div
        className="h-2 w-32 rounded"
        style={{
          background: `linear-gradient(to right, ${legend.stops.join(', ')})`,
        }}
      />
      <div className="flex justify-between text-[10px] text-gray-500 mt-0.5">
        <span>Low</span>
        <span>High</span>
      </div>
    </div>
  );
}

function InteractiveMap({ lat, lon, locationName }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const baseLayerRef = useRef(null);
  const markerRef = useRef(null);
  const overlayRef = useRef(null);
  const animStateRef = useRef(null);

  const [config, setConfig] = useState(null);
  const [activeLayer, setActiveLayer] = useState('radar');
  const [playing, setPlaying] = useState(true);
  const [frameIdx, setFrameIdx] = useState(0);
  const [frameTime, setFrameTime] = useState(null);

  // ── Init map (once) ─────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    const map = L.map(containerRef.current, {
      center: [lat ?? 20, lon ?? 0],
      zoom: 7,
      zoomControl: true,
      attributionControl: true,
    });

    baseLayerRef.current = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }
    ).addTo(map);

    mapRef.current = map;

    // Leaflet sometimes sizes wrong when initially hidden/animated
    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Recentre when the searched location changes ─────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || lat == null || lon == null) return;

    map.setView([lat, lon], 7);

    if (markerRef.current) markerRef.current.remove();
    const icon = L.divIcon({
      className: '',
      html:
        '<div style="background:#2563eb;width:14px;height:14px;border-radius:50%;' +
        'border:3px solid white;box-shadow:0 0 0 2px #2563eb;"></div>',
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });
    markerRef.current = L.marker([lat, lon], { icon })
      .bindTooltip(locationName || '', { direction: 'top', offset: [0, -8] })
      .addTo(map);
  }, [lat, lon, locationName]);

  // ── Load map config ─────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    getMapConfig()
      .then((res) => { if (!cancelled) setConfig(res.data); })
      .catch((err) => console.error('Map config failed:', err));
    return () => { cancelled = true; };
  }, []);

  // ── Build/rebuild overlay when layer or config changes ──────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !config) return;

    // Tear down previous overlay
    if (overlayRef.current) {
      map.removeLayer(overlayRef.current);
      overlayRef.current = null;
    }
    animStateRef.current = null;

    const info = config.layers.find((l) => l.id === activeLayer);
    if (!info?.available) return;

    if (info.provider === 'rainviewer' && config.rainViewer) {
      const past = config.rainViewer.radar?.past || [];
      const nowcast = config.rainViewer.radar?.nowcast || [];
      const frames = [...past, ...nowcast];
      if (frames.length === 0) return;

      const host = config.rainViewer.host;
      const startIdx = frames.length - 1;
      const startUrl = `${host}${frames[startIdx].path}/256/{z}/{x}/{y}/2/1_1.png`;

      const tileLayer = L.tileLayer(startUrl, {
        opacity: 0.7,
        tileSize: 256,
        attribution: 'Radar &copy; RainViewer',
      }).addTo(map);

      overlayRef.current = tileLayer;
      animStateRef.current = {
        host,
        frames,
        tileLayer,
        currentIdx: startIdx,
        nowcastStart: past.length,
      };
      setFrameIdx(startIdx);
      setFrameTime(new Date(frames[startIdx].time * 1000));
    } else if (info.provider === 'openweathermap' && info.tileUrl) {
      const tileLayer = L.tileLayer(`${API_URL}${info.tileUrl}`, {
        opacity: 0.65,
        tileSize: 256,
        attribution: '&copy; OpenWeatherMap',
      }).addTo(map);
      overlayRef.current = tileLayer;
    }
  }, [activeLayer, config]);

  // ── Animation loop (depends only on playing) ────────────────
  useEffect(() => {
    if (!playing || !animStateRef.current) return;
    const state = animStateRef.current;
    if (state.frames.length <= 1) return;

    const timer = setInterval(() => {
      state.currentIdx = (state.currentIdx + 1) % state.frames.length;
      const f = state.frames[state.currentIdx];
      state.tileLayer.setUrl(`${state.host}${f.path}/256/{z}/{x}/{y}/2/1_1.png`);
      setFrameIdx(state.currentIdx);
      setFrameTime(new Date(f.time * 1000));
    }, 500);

    return () => clearInterval(timer);
  }, [playing]);

  if (lat == null || lon == null) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
        Search a location to see the interactive map.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <h3 className="text-xl font-bold text-gray-800">Interactive Weather Map</h3>
        {activeLayer === 'radar' && animStateRef.current && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPlaying((p) => !p)}
              className="px-3 py-1 rounded-lg bg-blue-500 text-white text-sm hover:bg-blue-600"
            >
              {playing ? '⏸ Pause' : '▶ Play'}
            </button>
            {frameTime && (
              <span className="text-xs text-gray-600">
                {animStateRef.current.currentIdx >= animStateRef.current.nowcastStart
                  ? 'Forecast '
                  : ''}
                {frameTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Layer switcher */}
      <div className="flex flex-wrap gap-2 mb-3">
        {(config?.layers || []).map((l) => (
          <button
            key={l.id}
            onClick={() => l.available && setActiveLayer(l.id)}
            disabled={!l.available}
            title={!l.available ? 'Requires OPENWEATHERMAP_API_KEY in .env' : undefined}
            className={`px-3 py-1 rounded-lg text-sm transition ${
              activeLayer === l.id
                ? 'bg-blue-600 text-white'
                : l.available
                ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* Map */}
      <div className="relative">
        <div
          ref={containerRef}
          className="w-full h-[28rem] rounded-lg overflow-hidden z-0"
          role="application"
          aria-label={`Interactive weather map for ${locationName || 'selected location'}`}
        />
        <Legend layerId={activeLayer} />
      </div>

      <p className="text-xs text-gray-500 mt-3">
        Base map © OpenStreetMap · Radar © RainViewer · Overlays © OpenWeatherMap
      </p>
    </div>
  );
}

export default InteractiveMap;