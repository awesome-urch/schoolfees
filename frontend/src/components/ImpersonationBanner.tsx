'use client';

import { useEffect, useState } from 'react';

// Shown while a super admin is viewing a school's dashboard via "Login as".
// The admin's own session was stashed in localStorage before the swap; this
// banner restores it in one click instead of forcing a re-login.
export default function ImpersonationBanner() {
  const [impersonating, setImpersonating] = useState(false);
  const [schoolName, setSchoolName] = useState('');

  useEffect(() => {
    setImpersonating(!!localStorage.getItem('impersonatorSession'));
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      setSchoolName(user?.name || user?.schoolName || user?.fullName || '');
    } catch {}
  }, []);

  if (!impersonating) return null;

  const returnToAdmin = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('impersonatorSession') || '{}');
      if (saved.accessToken) localStorage.setItem('accessToken', saved.accessToken);
      if (saved.refreshToken) localStorage.setItem('refreshToken', saved.refreshToken);
      if (saved.user) localStorage.setItem('user', saved.user);
    } catch {}
    localStorage.removeItem('impersonatorSession');
    window.location.href = '/admin/school-owners';
  };

  return (
    <div className="bg-amber-400 text-amber-950 text-center text-sm font-medium py-2 px-4 sticky top-0 z-50">
      Viewing {schoolName ? <strong>{schoolName}</strong> : 'this school'} as an impersonated owner.
      <button onClick={returnToAdmin} className="ml-2 underline font-semibold hover:text-amber-800">
        Return to admin
      </button>
    </div>
  );
}
