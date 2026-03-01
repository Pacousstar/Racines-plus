"use client";

/**
 * LeafletMap.tsx — Composant Carte Leaflet OpenStreetMap
 * Affiche la carte monde réelle avec les markers de migration des utilisateurs Racines+
 * Importé dynamiquement (ssr:false) pour éviter les erreurs SSR de Leaflet
 */

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { MigrationMarker } from './MigrationMap';

// Correction du chemin des icônes Leaflet pour Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Icône personnalisée pour Toa-Zéo (foyer vert)
const originIcon = new L.DivIcon({
    className: '',
    html: `<div style="
        width: 36px; height: 36px;
        background: #124E35;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 0 0 4px rgba(18,78,53,0.3), 0 4px 15px rgba(0,0,0,0.3);
        display: flex; align-items: center; justify-content: center;
        font-size: 16px;
    ">🏡</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
});

// Icône personnalisée pour les destinations (orange)
const createDiasporaIcon = (count: number) => new L.DivIcon({
    className: '',
    html: `<div style="
        width: ${count > 5 ? 40 : count > 1 ? 32 : 26}px;
        height: ${count > 5 ? 40 : count > 1 ? 32 : 26}px;
        background: #FF6600;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 0 0 3px rgba(255,102,0,0.25), 0 4px 12px rgba(0,0,0,0.25);
        display: flex; align-items: center; justify-content: center;
        color: white; font-size: 11px; font-weight: 900;
        font-family: system-ui, sans-serif;
    ">${count}</div>`,
    iconSize: [count > 5 ? 40 : count > 1 ? 32 : 26, count > 5 ? 40 : count > 1 ? 32 : 26],
    iconAnchor: [(count > 5 ? 40 : count > 1 ? 32 : 26) / 2, (count > 5 ? 40 : count > 1 ? 32 : 26) / 2],
    popupAnchor: [0, -20],
});

// Coordonnées du foyer Toa-Zéo
const TOA_ZEO: [number, number] = [7.5400, -5.5471];

interface LeafletMapProps {
    markers: MigrationMarker[];
}

// Auto-fit aux bounds des markers
function MapBoundsAdjuster({ markers }: { markers: MigrationMarker[] }) {
    const map = useMap();
    useEffect(() => {
        const validMarkers = markers.filter(m => m.lat && m.lng);
        if (validMarkers.length > 0) {
            const bounds = L.latLngBounds([TOA_ZEO, ...validMarkers.map(m => [m.lat!, m.lng!] as [number, number])]);
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 5 });
        }
    }, [map, markers]);
    return null;
}

export default function LeafletMap({ markers }: LeafletMapProps) {
    const diasporaMarkers = markers.filter(m => m.lat && m.lng && m.country !== 'CI');
    const hasMarkers = diasporaMarkers.length > 0;

    return (
        <MapContainer
            center={TOA_ZEO}
            zoom={hasMarkers ? 2 : 4}
            style={{ height: '450px', width: '100%' }}
            attributionControl={false}
        >
            {/* Tuiles OpenStreetMap — gratuit, aucune clé API requise */}
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />

            {/* Ajustement automatique de la vue */}
            {hasMarkers && <MapBoundsAdjuster markers={markers} />}

            {/* 🟢 Marker d'origine — Toa-Zéo */}
            <Marker position={TOA_ZEO} icon={originIcon}>
                <Popup>
                    <div style={{ fontFamily: 'system-ui, sans-serif', minWidth: '160px' }}>
                        <p style={{ fontWeight: 900, fontSize: '13px', color: '#124E35', margin: '0 0 4px' }}>
                            🏡 Toa-Zéo
                        </p>
                        <p style={{ fontSize: '11px', color: '#666', margin: 0 }}>
                            Côte d'Ivoire — Village Fondateur
                        </p>
                        <div style={{ marginTop: '8px', padding: '6px 8px', background: '#f0faf5', borderRadius: '8px', fontSize: '11px', fontWeight: 700, color: '#124E35' }}>
                            🌍 Foyer de la Lignée
                        </div>
                    </div>
                </Popup>
            </Marker>

            {/* 🟠 Markers Diaspora + Lignes de migration */}
            {diasporaMarkers.map((item, idx) => (
                <React.Fragment key={idx}>
                    {/* Ligne reliant Toa-Zéo à la destination */}
                    <Polyline
                        positions={[TOA_ZEO, [item.lat!, item.lng!]]}
                        color="#FF6600"
                        weight={1.5}
                        opacity={0.5}
                        dashArray="6, 8"
                    />
                    {/* Marker de destination */}
                    <Marker position={[item.lat!, item.lng!]} icon={createDiasporaIcon(item.count)}>
                        <Popup>
                            <div style={{ fontFamily: 'system-ui, sans-serif', minWidth: '160px' }}>
                                <p style={{ fontWeight: 900, fontSize: '13px', color: '#1a1a1a', margin: '0 0 2px' }}>
                                    {item.city}
                                </p>
                                <p style={{ fontSize: '11px', color: '#666', margin: '0 0 8px' }}>{item.country}</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fff5ec', padding: '6px 8px', borderRadius: '8px' }}>
                                    <span style={{ fontSize: '16px', fontWeight: 900, color: '#FF6600' }}>{item.count}</span>
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#FF6600' }}>membre{item.count > 1 ? 's' : ''} certifié{item.count > 1 ? 's' : ''}</span>
                                </div>
                                {item.members.length > 0 && (
                                    <div style={{ marginTop: '6px' }}>
                                        {item.members.slice(0, 3).map((name, i) => (
                                            <p key={i} style={{ fontSize: '10px', color: '#888', margin: '2px 0' }}>• {name}</p>
                                        ))}
                                        {item.members.length > 3 && (
                                            <p style={{ fontSize: '10px', color: '#FF6600', fontWeight: 700, margin: '2px 0' }}>+{item.members.length - 3} autres</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                </React.Fragment>
            ))}
        </MapContainer>
    );
}
