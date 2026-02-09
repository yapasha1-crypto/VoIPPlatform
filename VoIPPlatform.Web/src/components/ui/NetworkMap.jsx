import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Server locations with coordinates
const serverLocations = [
  { id: 1, city: 'London', country: 'United Kingdom', lat: 51.5074, lng: -0.1278, flag: '🇬🇧' },
  { id: 2, city: 'New York', country: 'United States', lat: 40.7128, lng: -74.0060, flag: '🇺🇸' },
  { id: 3, city: 'Dubai', country: 'United Arab Emirates', lat: 25.2048, lng: 55.2708, flag: '🇦🇪' },
  { id: 4, city: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198, flag: '🇸🇬' },
  { id: 5, city: 'Frankfurt', country: 'Germany', lat: 50.1109, lng: 8.6821, flag: '🇩🇪' },
];

// Custom pulsing marker icon with violet/purple theme
const createPulsingIcon = () => {
  return L.divIcon({
    className: 'custom-pulsing-marker',
    html: `
      <div class="pulse-container">
        <div class="pulse-dot"></div>
        <div class="pulse-ring"></div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

const NetworkMap = () => {
  // World view center
  const center = [20, 0];
  const zoom = 2;

  return (
    <div className="relative w-full">
      {/* Glassmorphism Container */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <MapContainer
          center={center}
          zoom={zoom}
          scrollWheelZoom={false}
          className="w-full h-[400px] md:h-[500px] lg:h-[600px] z-10"
          style={{ background: '#0f172a' }}
        >
          {/* CartoDB Dark Matter Tiles */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
            maxZoom={19}
          />

          {/* Server Location Markers */}
          {serverLocations.map((location) => (
            <Marker
              key={location.id}
              position={[location.lat, location.lng]}
              icon={createPulsingIcon()}
            >
              <Popup className="custom-popup">
                <div className="p-2 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{location.flag}</span>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">
                        {location.city}
                      </h3>
                      <p className="text-slate-600 text-sm">{location.country}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-slate-600 font-medium">Active Server</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Overlay Gradient for depth effect */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-900/20 to-transparent z-20"></div>
      </div>

      {/* Custom CSS for pulsing markers */}
      <style jsx>{`
        .custom-pulsing-marker {
          background: transparent;
          border: none;
        }

        .pulse-container {
          position: relative;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pulse-dot {
          position: absolute;
          width: 12px;
          height: 12px;
          background: linear-gradient(135deg, #7c3aed 0%, #9333ea 50%, #a855f7 100%);
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(139, 92, 246, 0.8), 0 0 20px rgba(139, 92, 246, 0.4);
          z-index: 2;
        }

        .pulse-ring {
          position: absolute;
          width: 30px;
          height: 30px;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%);
          border-radius: 50%;
          animation: pulse 2s ease-out infinite;
          z-index: 1;
        }

        @keyframes pulse {
          0% {
            transform: scale(0.5);
            opacity: 1;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.5;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }

        /* Custom popup styling */
        :global(.leaflet-popup-content-wrapper) {
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          padding: 0;
        }

        :global(.leaflet-popup-content) {
          margin: 0;
          min-width: 200px;
        }

        :global(.leaflet-popup-tip) {
          background: white;
        }

        :global(.leaflet-container) {
          font-family: inherit;
        }
      `}</style>
    </div>
  );
};

export default NetworkMap;
