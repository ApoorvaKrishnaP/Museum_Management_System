import { useState, useEffect } from 'react';

'use client';


interface Artefact {
    id: string;
    name: string;
    description: string;
    category: string;
    acquiredDate: string;
    condition: string;
}

export default function ArtefactPage() {
    const [artefacts, setArtefacts] = useState<Artefact[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchArtefacts();
    }, []);

    const fetchArtefacts = async () => {
        try {
            const response = await fetch('/api/artefacts');
            if (!response.ok) throw new Error('Failed to fetch artefacts');
            const data = await response.json();
            setArtefacts(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8">Loading artefacts...</div>;
    if (error) return <div className="p-8 text-red-600">Error: {error}</div>;

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">Museum Artefacts</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {artefacts.map((artefact) => (
                    <div key={artefact.id} className="border rounded-lg p-4 shadow-md">
                        <h2 className="text-xl font-semibold">{artefact.name}</h2>
                        <p className="text-gray-600 text-sm mt-2">{artefact.description}</p>
                        <div className="mt-4 space-y-2 text-sm">
                            <p><strong>Category:</strong> {artefact.category}</p>
                            <p><strong>Acquired:</strong> {artefact.acquiredDate}</p>
                            <p><strong>Condition:</strong> {artefact.condition}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}