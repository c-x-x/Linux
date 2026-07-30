if (process.env.VERCEL === '1' && process.env.VERCEL_ENV === 'production') {
  console.warn(
    'Production safe mode: the learning site will deploy, while the unverified technical-probe guest remains disabled.',
  )
}
