if (process.env.VERCEL === '1' && process.env.VERCEL_ENV === 'production') {
  console.error(
    'Production deployment is blocked: the technical-probe guest does not yet have complete source and license evidence.',
  )
  process.exit(1)
}
