"use client";

import React, { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Html, useCursor, Edges } from '@react-three/drei';
import * as THREE from 'three';

// --- Types ---
type FacilityType = 'Restroom' | 'Reception' | 'Cafe' | 'Elevator' | 'Stairs';

type MapItem = {
    id: string;
    name: string;
    type: 'gallery' | 'facility';
    facilityType?: FacilityType;
    x: number; // 0-100% relative to floor width
    z: number; // 0-100% relative to floor depth
    width: number;
    depth: number;
    color: string;
    description: string;
};

type FloorData = {
    floorNumber: number;
    name: string;
    items: MapItem[];
};

// --- Data ---
const MUSEUM_DATA: FloorData[] = [
    {
        floorNumber: 0,
        name: "Ground Floor",
        items: [
            { id: "reception", name: "Main Reception", type: "facility", facilityType: "Reception", x: 50, z: 90, width: 30, depth: 15, color: "#4ade80", description: "Tickets, Information usage, and Audio Guides." },
            { id: "cafe", name: "Museum Cafe", type: "facility", facilityType: "Cafe", x: 80, z: 80, width: 20, depth: 25, color: "#facc15", description: "Snacks and beverages." },
            { id: "ancient_india_1", name: "Ancient India Gallery", type: "gallery", x: 30, z: 40, width: 50, depth: 40, color: "#d97706", description: "Artifacts from the Vedic period, Mauryan, and Gupta empires." },
            { id: "restroom_g", name: "Restroom", type: "facility", facilityType: "Restroom", x: 90, z: 10, width: 10, depth: 10, color: "#3b82f6", description: "Public Restrooms." },
        ]
    },
    {
        floorNumber: 1,
        name: "First Floor",
        items: [
            { id: "textile", name: "Textile & Handicrafts", type: "gallery", x: 25, z: 50, width: 40, depth: 80, color: "#e11d48", description: "Traditional weaving, embroidery, and regional artisan crafts." },
            { id: "tribal", name: "Tribal & Folk Art", type: "gallery", x: 75, z: 50, width: 40, depth: 80, color: "#9333ea", description: "Indigenous art, masks, and folklore exhibits." },
            { id: "restroom_1", name: "Restroom", type: "facility", facilityType: "Restroom", x: 90, z: 5, width: 10, depth: 10, color: "#3b82f6", description: "Restrooms." },
        ]
    },
    {
        floorNumber: 2,
        name: "Second Floor",
        items: [
            { id: "modern_art", name: "Modern Art Gallery", type: "gallery", x: 50, z: 30, width: 80, depth: 40, color: "#06b6d4", description: "Contemporary Indian art from the 19th and 20th centuries." },
            { id: "sculpture", name: "Sculpture Garden", type: "gallery", x: 50, z: 75, width: 60, depth: 30, color: "#10b981", description: "Stone and bronze sculptures from various eras." },
            { id: "restroom_2", name: "Restroom", type: "facility", facilityType: "Restroom", x: 90, z: 5, width: 10, depth: 10, color: "#3b82f6", description: "Restrooms." },
        ]
    },
    {
        floorNumber: 3,
        name: "Third Floor",
        items: [
            { id: "science", name: "Science & Innovation", type: "gallery", x: 40, z: 50, width: 60, depth: 80, color: "#f97316", description: "History of science, technology, and astronomy in India." },
            { id: "coins", name: "Numismatics", type: "gallery", x: 85, z: 50, width: 20, depth: 60, color: "#fbbf24", description: "Rare coins and currency from ancient to modern times." },
        ]
    }
];

// --- 3D Components ---

const BoxItem = ({ item, floorY, onClick, isSelected }: { item: MapItem, floorY: number, onClick: (item: MapItem) => void, isSelected: boolean }) => {
    // Map 0-100 coordinates to Scene Coordinates (e.g., -50 to 50)
    // Floor size assumed 100x100 for simplicity in calculation, scaled to world units.
    const width = item.width;
    const depth = item.depth;
    const x = item.x - 50;
    const z = item.z - 50;

    // Height: Galleries are taller, facilities shorter
    const height = item.type === 'gallery' ? 8 : 4;
    const yPos = floorY + height / 2;

    const [hovered, setHover] = useState(false);
    useCursor(hovered);

    return (
        <group position={[x, yPos, z]}>
            <mesh
                onClick={(e) => { e.stopPropagation(); onClick(item); }}
                onPointerOver={() => setHover(true)}
                onPointerOut={() => setHover(false)}
            >
                <boxGeometry args={[width, height, depth]} />
                <meshStandardMaterial
                    color={item.color}
                    transparent
                    opacity={isSelected ? 1 : (hovered ? 0.9 : 0.7)}
                    roughness={0.2}
                    metalness={0.1}
                />
                <Edges visible={true} scale={1} threshold={15} color={isSelected ? "white" : "black"} />
            </mesh>

            {/* Label */}
            {(hovered || isSelected || item.type === 'gallery') && (
                <Html position={[0, height / 2 + 2, 0]} center distanceFactor={150} zIndexRange={[100, 0]}>
                    <div className="bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap border border-white/20 backdrop-blur-sm pointer-events-none">
                        {item.name}
                    </div>
                </Html>
            )}
        </group>
    );
};

const Floor = ({ data, yLevel, isExpanded, onSelect }: { data: FloorData, yLevel: number, isExpanded: boolean, onSelect: (item: MapItem | null) => void }) => {
    // Calculate vertical position based on expansion
    // If expanded, spread floors out.
    const currentY = isExpanded ? yLevel * 30 : yLevel * 15;

    return (
        <group position={[0, currentY, 0]}>
            {/* Floor Base */}
            <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <boxGeometry args={[110, 110, 1]} />
                <meshStandardMaterial color="#334155" roughness={0.5} transparent opacity={0.9} />
                <Edges color="#1e293b" />
            </mesh>

            {/* Floor Label */}
            <Text
                position={[-65, 5, 0]}
                rotation={[0, Math.PI / 2, 0]}
                fontSize={8}
                color="#94a3b8"
                anchorX="center"
                anchorY="middle"
            >
                {data.floorNumber === 0 ? "GF" : `L${data.floorNumber}`}
            </Text>

            {/* Items */}
            {data.items.map(item => (
                <BoxItem
                    key={item.id}
                    item={item}
                    floorY={0.5} // Slightly above floor base
                    isSelected={false} // Managed by parent in real app, simplified here
                    onClick={onSelect}
                />
            ))}
        </group>
    );
};

const Building = ({ onSelect }: { onSelect: (item: MapItem | null) => void }) => {
    const [expanded, setExpanded] = useState(false);

    // Toggle expansion on click of the building base or button
    return (
        <group>
            {/* Centered Controls/Toggle */}
            <Html position={[70, 0, 0]}>
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-full shadow-lg transition-transform hover:scale-110 flex items-center justify-center w-12 h-12"
                    title={expanded ? "Collapse View" : "Explode View"}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        {expanded ? (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5M15 15l5.25 5.25" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                        )}
                    </svg>
                </button>
            </Html>

            {MUSEUM_DATA.map((floor) => (
                <Floor
                    key={floor.floorNumber}
                    data={floor}
                    yLevel={floor.floorNumber}
                    isExpanded={expanded}
                    onSelect={onSelect}
                />
            ))}
        </group>
    );
}

// --- Main Page Component ---

export default function MuseumMap() {
    const [selectedItem, setSelectedItem] = useState<MapItem | null>(null);

    return (
        <div className="w-full h-screen bg-[#0f172a] relative overflow-hidden font-sans">

            {/* Header */}
            <div className="absolute top-6 left-6 z-10">
                <h1 className="text-3xl font-bold text-white tracking-tight">Museum<span className="text-blue-500">Map</span></h1>
                <p className="text-gray-400 text-sm">Interactive 3D Floor Plan</p>
            </div>

            {/* 3D Viewport */}
            <Canvas shadows camera={{ position: [100, 100, 100], fov: 35 }}>
                <color attach="background" args={['#0f172a']} />
                <fog attach="fog" args={['#0f172a', 150, 400]} />

                <ambientLight intensity={0.7} />
                <directionalLight position={[50, 100, 50]} intensity={1} castShadow shadow-mapSize={[1024, 1024]} />

                <group position={[0, -20, 0]}>
                    <Building onSelect={setSelectedItem} />
                </group>

                <OrbitControls
                    makeDefault
                    minPolarAngle={0}
                    maxPolarAngle={Math.PI / 2.1}
                    maxDistance={300}
                    minDistance={50}
                    dampingFactor={0.1}
                />
            </Canvas>

            {/* Sidebar / Info Panel */}
            <div className={`absolute top-0 right-0 h-full w-96 bg-gray-900/95 border-l border-gray-800 p-8 transform transition-transform duration-300 ease-in-out ${selectedItem ? 'translate-x-0' : 'translate-x-full'}`}>
                {selectedItem ? (
                    <div className="flex flex-col h-full">
                        <button
                            onClick={() => setSelectedItem(null)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-white"
                        >
                            ✕
                        </button>

                        <div className="mb-6">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-bold uppercase tracking-wider mb-2 ${selectedItem.type === 'gallery' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                {selectedItem.type === 'facility' ? selectedItem.facilityType : 'Gallery'}
                            </span>
                            <h2 className="text-3xl font-bold text-white mb-2">{selectedItem.name}</h2>
                            <div className="h-1 w-20 bg-blue-500 rounded-full" />
                        </div>

                        <div className="space-y-6 flex-1 overflow-y-auto">
                            <p className="text-gray-300 leading-relaxed text-lg">
                                {selectedItem.description}
                            </p>

                            <div className="bg-gray-800/50 rounded-xl p-4 space-y-3 border border-gray-700">
                                <h3 className="text-sm font-semibold text-gray-400 uppercase">Location Details</h3>
                                <div className="flex justify-between border-b border-gray-700 pb-2">
                                    <span className="text-gray-400">Position</span>
                                    <span className="text-white font-mono">X:{selectedItem.x} | Z:{selectedItem.z}</span>
                                </div>
                                <div className="flex justify-between pt-2">
                                    <span className="text-gray-400">Area</span>
                                    <span className="text-white font-mono">{selectedItem.width}m × {selectedItem.depth}m</span>
                                </div>
                            </div>

                            {/* Contextual Actions */}
                            <div className="pt-4">
                                {selectedItem.type === 'gallery' && (
                                    <button className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition mb-3">
                                        View Artifacts List
                                    </button>
                                )}
                                <button className="w-full border border-gray-600 text-white font-bold py-3 rounded-lg hover:bg-gray-800 transition">
                                    Get Directions
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        Select a room to view details
                    </div>
                )}
            </div>

            {/* Legend / Help */}
            <div className="absolute bottom-6 left-6 p-4 bg-gray-900/80 backdrop-blur rounded-xl border border-gray-800 text-xs text-gray-400 space-y-2 pointer-events-none">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                    <span>Gallery</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                    <span>Facility (Restroom/Reception)</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                    <span>Cafe/Food</span>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-700">
                    <p>Left Click: Select</p>
                    <p>Right Drag: Rotate</p>
                    <p>Scroll: Zoom</p>
                </div>
            </div>
        </div>
    );
}
