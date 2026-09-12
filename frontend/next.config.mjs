/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: '/dashboard', destination: '/ops', permanent: false },
      { source: '/admin', destination: '/ops', permanent: false },
      { source: '/customer', destination: '/booking', permanent: false },
      { source: '/login', destination: '/auth/login', permanent: false },
      { source: '/signup', destination: '/auth/signup', permanent: false },
      { source: '/my-appointments', destination: '/appointments', permanent: false },
      { source: '/todays-appointments', destination: '/ops?tab=today', permanent: false },
      { source: '/crew-scheduling-and-availability', destination: '/ops?tab=scheduling', permanent: false },
      { source: '/delays-and-cancellations', destination: '/ops?tab=delays', permanent: false },
      { source: '/upcoming-bookings', destination: '/ops?tab=upcoming', permanent: false },
      { source: '/customer-portal', destination: '/booking', permanent: false },
      { source: '/crew-mobile-field-view', destination: '/crew', permanent: false },
      { source: '/rbac-and-security', destination: '/ops?tab=rbac', permanent: false },
    ];
  },
};

export default nextConfig;
