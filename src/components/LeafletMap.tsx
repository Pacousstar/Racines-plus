"use client";

/**
 * LeafletMap.tsx — Composant Carte Leaflet
 * Tuile CartoDB Voyager → noms de pays en latin/français (pas en arabe)
 * Markers CI (vert) + Diaspora internationale (orange)
 */

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { MigrationMarker } from './MigrationMap';
import { COUNTRY_COORDS } from './MigrationMap';

// ─── Correction icônes Leaflet pour Next.js ─────────────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// ─── Icônes personnalisées ────────────────────────────────────────────

const originIcon = new L.DivIcon({
    className: '',
    html: `<div style="
        width: 40px; height: 40px;
        background: #124E35;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 0 0 5px rgba(18,78,53,0.25), 0 4px 15px rgba(0,0,0,0.3);
        display: flex; align-items: center; justify-content: center;
        font-size: 18px;
    ">🏡</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -22],
});

const createCIIcon = (count: number) => new L.DivIcon({
    className: '',
    html: `<div style="
        width: ${count > 3 ? 34 : 28}px;
        height: ${count > 3 ? 34 : 28}px;
        background: #1f6b4a;
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 0 0 3px rgba(31,107,74,0.2), 0 3px 10px rgba(0,0,0,0.2);
        display: flex; align-items: center; justify-content: center;
        color: white; font-size: 11px; font-weight: 900;
        font-family: system-ui, sans-serif;
    ">${count}</div>`,
    iconSize: [count > 3 ? 34 : 28, count > 3 ? 34 : 28],
    iconAnchor: [(count > 3 ? 34 : 28) / 2, (count > 3 ? 34 : 28) / 2],
    popupAnchor: [0, -18],
});

const createDiasporaIcon = (count: number) => new L.DivIcon({
    className: '',
    html: `<div style="
        width: ${count > 5 ? 42 : count > 1 ? 34 : 28}px;
        height: ${count > 5 ? 42 : count > 1 ? 34 : 28}px;
        background: #FF6600;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 0 0 3px rgba(255,102,0,0.25), 0 4px 12px rgba(0,0,0,0.25);
        display: flex; align-items: center; justify-content: center;
        color: white; font-size: 11px; font-weight: 900;
        font-family: system-ui, sans-serif;
    ">${count}</div>`,
    iconSize: [count > 5 ? 42 : count > 1 ? 34 : 28, count > 5 ? 42 : count > 1 ? 34 : 28],
    iconAnchor: [(count > 5 ? 42 : count > 1 ? 34 : 28) / 2, (count > 5 ? 42 : count > 1 ? 34 : 28) / 2],
    popupAnchor: [0, -22],
});

// ─── Constantes ───────────────────────────────────────────────────────

const TOA_ZEO: [number, number] = [6.805080, -7.329396];

// ─── Types ────────────────────────────────────────────────────────────

interface LeafletMapProps {
    markers: MigrationMarker[];
}

// ─── Auto-fit aux bounds ──────────────────────────────────────────────

function MapBoundsAdjuster({ markers }: { markers: MigrationMarker[] }) {
    const map = useMap();
    useEffect(() => {
        const validMarkers = markers.filter(m => m.lat && m.lng);
        if (validMarkers.length > 0) {
            const bounds = L.latLngBounds([TOA_ZEO, ...validMarkers.map(m => [m.lat!, m.lng!] as [number, number])]);
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 6 });
        }
    }, [map, markers]);
    return null;
}

// ─── Popup partagée ───────────────────────────────────────────────────

function MemberPopup({ item }: { item: MigrationMarker }) {
    const meta = COUNTRY_COORDS[item.country];
    return (
        <div style={{ fontFamily: 'system-ui, sans-serif', minWidth: '170px' }}>
            <p style={{ fontWeight: 900, fontSize: '13px', color: '#1a1a1a', margin: '0 0 2px' }}>{item.city}</p>
            <p style={{ fontSize: '11px', color: '#666', margin: '0 0 8px' }}>
                {meta?.flag || '🌍'} {meta?.name || item.country}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: item.country === 'CI' ? '#f0faf5' : '#fff5ec', padding: '6px 8px', borderRadius: '8px' }}>
                <span style={{ fontSize: '16px', fontWeight: 900, color: item.country === 'CI' ? '#124E35' : '#FF6600' }}>{item.count}</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: item.country === 'CI' ? '#124E35' : '#FF6600' }}>
                    membre{item.count > 1 ? 's' : ''} certifié{item.count > 1 ? 's' : ''}
                </span>
            </div>
            {item.members.length > 0 && (
                <div style={{ marginTop: '8px', borderTop: '1px solid #f0f0f0', paddingTop: '8px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
                        {item.members.slice(0, 6).map((member, i) => (
                            <div key={i} title={member.name} style={{
                                width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden',
                                border: '2px solid white', boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
                                flexShrink: 0, marginLeft: i > 0 ? '-10px' : '0', zIndex: 10 - i, position: 'relative'
                            }}>
                                {member.avatarUrl
                                    ? <img src={member.avatarUrl} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : <div style={{ width: '100%', height: '100%', backgroundColor: '#FFEBCC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 900, color: '#FF6600' }}>
                                        {member.name.charAt(0).toUpperCase()}
                                    </div>
                                }
                            </div>
                        ))}
                        {item.members.length > 6 && (
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#FF6600', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', border: '2px solid white', flexShrink: 0, marginLeft: '-10px', zIndex: 11, position: 'relative' }}>
                                +{item.members.length - 6}
                            </div>
                        )}
                    </div>
                    <div style={{ maxHeight: '60px', overflowY: 'auto' }}>
                        {item.members.slice(0, 3).map((member, i) => (
                            <p key={i} style={{ fontSize: '10px', color: '#555', margin: '3px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>
                                • {member.name}
                            </p>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Composant principal ──────────────────────────────────────────────

export default function LeafletMap({ markers }: LeafletMapProps) {
    const ciMarkers = markers.filter(m =>
        m.lat && m.lng && m.country === 'CI' &&
        !(Math.abs(m.lat - TOA_ZEO[0]) < 0.01 && Math.abs(m.lng - TOA_ZEO[1]) < 0.01)
    );
    const diasporaMarkers = markers.filter(m => m.lat && m.lng && m.country !== 'CI');
    const hasMarkers = ciMarkers.length > 0 || diasporaMarkers.length > 0;

    return (
        <MapContainer
            center={TOA_ZEO}
            zoom={hasMarkers ? 2 : 5}
            style={{ height: '520px', width: '100%' }}
            attributionControl={false}
        >
            {/*
              * Tuile CartoDB Voyager — noms en latin/français, pas en arabe.
              * Gratuite, sans clé API, lisible partout dans le monde.
              */}
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                subdomains="abcd"
                maxZoom={19}
            />

            {hasMarkers && <MapBoundsAdjuster markers={markers} />}

            {/* 🟢 Toa-Zéo (foyer) */}
            <Marker position={TOA_ZEO} icon={originIcon}>
                <Popup>
                    <div style={{ fontFamily: 'system-ui, sans-serif', minWidth: '160px' }}>
                        <p style={{ fontWeight: 900, fontSize: '13px', color: '#124E35', margin: '0 0 4px' }}>🏡 Toa-Zéo</p>
                        <p style={{ fontSize: '11px', color: '#666', margin: 0 }}>Côte d{"'"}Ivoire — Village Fondateur</p>
                        <div style={{ marginTop: '8px', padding: '6px 8px', background: '#f0faf5', borderRadius: '8px', fontSize: '11px', fontWeight: 700, color: '#124E35' }}>
                            🌍 Foyer de la Lignée
                        </div>
                    </div>
                </Popup>
            </Marker>

            {/* 🟩 Villes de Côte d'Ivoire + lignes de migration internes */}
            {ciMarkers.map((item, idx) => (
                <React.Fragment key={`ci-wrap-${idx}`}>
                    <Polyline
                        positions={[TOA_ZEO, [item.lat!, item.lng!]]}
                        color="#1f6b4a"
                        weight={1.5}
                        opacity={0.45}
                        dashArray="6, 8"
                    />
                    <Marker position={[item.lat!, item.lng!]} icon={createCIIcon(item.count)}>
                        <Popup><MemberPopup item={item} /></Popup>
                    </Marker>
                </React.Fragment>
            ))}

            {/* 🟠 Diaspora internationale + lignes de migration */}
            {diasporaMarkers.map((item, idx) => (
                <React.Fragment key={`d-${idx}`}>
                    <Polyline
                        positions={[TOA_ZEO, [item.lat!, item.lng!]]}
                        color="#FF6600"
                        weight={1.5}
                        opacity={0.45}
                        dashArray="6, 8"
                    />
                    <Marker position={[item.lat!, item.lng!]} icon={createDiasporaIcon(item.count)}>
                        <Popup><MemberPopup item={item} /></Popup>
                    </Marker>
                </React.Fragment>
            ))}
        </MapContainer>
    );
}
