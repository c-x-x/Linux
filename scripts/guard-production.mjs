if (process.env.VERCEL === '1' && process.env.VERCEL_ENV === 'production') {
  console.warn(
    'Production uses the integrity-pinned upstream v86 Buildroot demo image; it is not a reproducible project-owned guest image.',
  )
}
