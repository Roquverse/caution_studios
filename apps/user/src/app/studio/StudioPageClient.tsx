'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { UserRecordStudioModal } from '../../components/UserRecordStudioModal';
import { TrackItem, ProducerItem } from '../../types/tracks';

interface StudioPageClientProps {
  initialBeats: TrackItem[];
  initialProducers: ProducerItem[];
  beatIdParam?: string;
}

export default function StudioPageClient({
  initialBeats,
  initialProducers,
  beatIdParam
}: StudioPageClientProps) {
  const router = useRouter();

  // Find preselected beat matching URL param, or default to first beat
  const preselectedTrack = React.useMemo(() => {
    if (beatIdParam) {
      const match = initialBeats.find((b) => b.id === beatIdParam);
      if (match) return match;
    }
    return initialBeats.length > 0 ? initialBeats[0] : null;
  }, [initialBeats, beatIdParam]);

  const handleExitStudio = () => {
    router.push('/');
  };

  return (
    <main className="w-full min-h-screen bg-[#07090E] text-white">
      <UserRecordStudioModal
        isOpen={true}
        isStandalonePage={true}
        onClose={handleExitStudio}
        preselectedTrack={preselectedTrack}
        availableTracks={initialBeats}
      />
    </main>
  );
}
