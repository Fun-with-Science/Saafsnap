import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { LEVELS, priority, seenCount } from '../lib/priority'
import { LevelChip } from './ui'
import { useStore } from '../lib/store'

export const CITY_CENTER = [22.5726, 88.3639]
const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'

function pinIcon(level, label) {
  const c = LEVELS[level].color
  const pulse = level === 'critical' || level === 'high' ? `<span class="pulse" style="background:${c}"></span>` : ''
  return L.divIcon({
    html: `<div class="pin">${pulse}<span class="dot" style="background:${c}">${label}</span></div>`,
    className: '',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -16],
  })
}

const youIcon = L.divIcon({
  html: '<div class="pin"><span class="pulse" style="background:#10b981"></span><span class="dot" style="background:#10b981"><span style="width:9px;height:9px;border-radius:9999px;background:#fff"></span></span></div>',
  className: '',
  iconSize: [34, 34],
  iconAnchor: [17, 30],
})

// Leaflet measures its box on mount; re-measure once page transitions settle.
function AutoSize() {
  const map = useMap()
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 400)
    const ro = new ResizeObserver(() => map.invalidateSize())
    ro.observe(map.getContainer())
    return () => {
      clearTimeout(t)
      ro.disconnect()
    }
  }, [map])
  return null
}

function FitTo({ points }) {
  const map = useMap()
  useEffect(() => {
    if (points.length > 1) map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 14 })
    else if (points.length === 1) map.setView(points[0], 15)
    // Fit only on first render so user panning is not overridden.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

function FlyTo({ target }) {
  const map = useMap()
  useEffect(() => {
    if (target) map.flyTo(target, 15, { duration: 0.8 })
  }, [target, map])
  return null
}

export function CityMap({ reports, className = '', flyTo, me }) {
  const navigate = useNavigate()
  const { userById } = useStore()
  const items = useMemo(() => reports.map((r) => ({ r, p: priority(r), n: seenCount(r) })), [reports])
  const points = items.map(({ r }) => [r.location.lat, r.location.lng])

  return (
    <MapContainer center={CITY_CENTER} zoom={12} className={className} scrollWheelZoom zoomControl>
      <TileLayer url={TILE_URL} attribution={ATTRIBUTION} />
      <AutoSize />
      <FitTo points={points} />
      <FlyTo target={flyTo} />
      {items
        .filter(({ p }) => p.level !== 'clean')
        .map(({ r, p, n }) => (
          <Circle
            key={'c' + r.id}
            center={[r.location.lat, r.location.lng]}
            radius={Math.min(1100, 180 + n * 22)}
            pathOptions={{ color: LEVELS[p.level].color, fillColor: LEVELS[p.level].color, fillOpacity: 0.16, weight: 0 }}
          />
        ))}
      {items.map(({ r, p, n }) => {
        const cleaner = r.cleanup ? userById(r.cleanup.by) : null
        return (
          <Marker key={r.id} position={[r.location.lat, r.location.lng]} icon={pinIcon(p.level, p.level === 'clean' ? '✓' : n)}>
            <Popup>
              <div>
                <img src={r.cleanup?.photo || r.photo} alt="" className="h-32 w-full object-cover" />
                <div className="space-y-1.5 p-3">
                  <LevelChip level={p.level} />
                  <div className="font-display text-base font-extrabold leading-tight text-ink">{r.ai.title}</div>
                  <div className="text-xs font-bold text-ink/55">
                    {r.landmark || 'Pinned location'} · {n} people reported
                  </div>
                  {cleaner && (
                    <div className="flex items-center gap-1 text-xs font-extrabold text-leaf-700">
                      <Sparkles size={13} /> Cleaned by {cleaner.org?.name || cleaner.name}
                    </div>
                  )}
                  <button onClick={() => navigate(`/r/${r.id}`)} className="btn btn-primary btn-sm mt-1 w-full !text-sm">
                    Open report
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        )
      })}
      {me && <Marker position={[me.lat, me.lng]} icon={youIcon} />}
    </MapContainer>
  )
}

function ClickToPick({ onChange }) {
  useMapEvents({ click: (e) => onChange({ lat: e.latlng.lat, lng: e.latlng.lng, source: 'manual' }) })
  return null
}

export function PickMap({ value, onChange, className = '' }) {
  const center = value ? [value.lat, value.lng] : CITY_CENTER
  return (
    <MapContainer center={center} zoom={value ? 16 : 12} className={className} scrollWheelZoom>
      <TileLayer url={TILE_URL} attribution={ATTRIBUTION} />
      <AutoSize />
      <ClickToPick onChange={onChange} />
      {value && (
        <>
          <FlyTo target={[value.lat, value.lng]} />
          <Marker
            position={[value.lat, value.lng]}
            icon={youIcon}
            draggable
            eventHandlers={{ dragend: (e) => { const ll = e.target.getLatLng(); onChange({ lat: ll.lat, lng: ll.lng, source: 'manual' }) } }}
          />
        </>
      )}
    </MapContainer>
  )
}

export function MiniMap({ report, className = '' }) {
  const p = priority(report)
  return (
    <MapContainer center={[report.location.lat, report.location.lng]} zoom={15} className={className} scrollWheelZoom={false} dragging={false} zoomControl={false} doubleClickZoom={false}>
      <TileLayer url={TILE_URL} attribution={ATTRIBUTION} />
      <AutoSize />
      <Circle center={[report.location.lat, report.location.lng]} radius={120} pathOptions={{ color: LEVELS[p.level].color, fillOpacity: 0.2, weight: 0 }} />
      <Marker position={[report.location.lat, report.location.lng]} icon={pinIcon(p.level, p.level === 'clean' ? '✓' : seenCount(report))} />
    </MapContainer>
  )
}
