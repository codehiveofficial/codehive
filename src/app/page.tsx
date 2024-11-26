"use client";

import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  const navigateToCombined = () => {
    router.push('/combined');
  };

  return (
    <main>
      <button onClick={navigateToCombined} className="px-4 py-2 bg-blue-500 text-white rounded">
        Go to Combined
      </button>
    </main>
  );
}