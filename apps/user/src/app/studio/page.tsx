import React from 'react';
import { getStudioBeats } from '../../lib/getStudioBeats';
import StudioPageClient from './StudioPageClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface StudioPageProps {
  searchParams?: {
    beatId?: string;
  };
}

export default async function StudioPage({ searchParams }: StudioPageProps) {
  const { beats, producers } = await getStudioBeats();

  return (
    <StudioPageClient
      initialBeats={beats}
      initialProducers={producers}
      beatIdParam={searchParams?.beatId}
    />
  );
}
