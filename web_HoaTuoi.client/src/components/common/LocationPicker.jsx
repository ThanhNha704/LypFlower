import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, Navigation } from 'lucide-react';

// Sửa lỗi icon marker mặc định của Leaflet khi dùng với Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationMarker({ position, setPosition, onLocationSelected }) {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
      if (onLocationSelected) {
        onLocationSelected({ latitude: e.latlng.lat, longitude: e.latlng.lng });
      }
    },
  });

  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom());
    }
  }, [position, map]);

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

export default function LocationPicker({
  initialPosition = null,
  onLocationSelected,
  className = ''
}) {
  // Mặc định ở trung tâm TPHCM nếu chưa có vị trí
  const defaultPosition = { lat: 10.762622, lng: 106.660172 };
  const [position, setPosition] = useState(initialPosition);

  useEffect(() => {
    if (initialPosition?.lat !== position?.lat || initialPosition?.lng !== position?.lng) {
      setPosition(initialPosition);
    }
  }, [initialPosition?.lat, initialPosition?.lng]);

  const handleGetCurrentLocation = (e) => {
    e.preventDefault(); // Ngăn form submit
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (loc) => {
          setPosition({
            lat: loc.coords.latitude,
            lng: loc.coords.longitude
          });
          if (onLocationSelected) {
            onLocationSelected({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
          }
        },
        (error) => {
          console.error("Error getting location: ", error);
          alert("Không thể lấy vị trí hiện tại. Vui lòng kiểm tra quyền truy cập vị trí.");
        }
      );
    } else {
      alert("Trình duyệt của bạn không hỗ trợ lấy vị trí.");
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Vị trí nhận hàng (Ghim trên bản đồ)
        </label>
        <button
          onClick={handleGetCurrentLocation}
          className="flex items-center gap-1 text-sm text-pink-600 hover:text-pink-700 font-medium"
        >
          <Navigation className="w-4 h-4" />
          Dùng vị trí hiện tại
        </button>
      </div>

      <div className="h-[300px] w-full rounded-lg border border-gray-300 overflow-hidden relative z-0">
        <MapContainer
          key={`${position?.lat ?? defaultPosition.lat}-${position?.lng ?? defaultPosition.lng}`}
          center={position || defaultPosition}
          zoom={15}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} setPosition={setPosition} onLocationSelected={onLocationSelected} />
        </MapContainer>
      </div>
      {position && (
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          Đã chọn: {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
        </p>
      )}
    </div>
  );
}
