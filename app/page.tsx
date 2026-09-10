import { Landing } from '@/components/screens/Landing';
import { showcaseCompanies, showcaseVacancies } from '@/lib/showcase';

/**
 * Витрина. Статична намеренно: главная должна открываться мгновенно и
 * не зависеть ни от базы, ни от сессии.
 */
export default function HomePage() {
  return <Landing vacancies={showcaseVacancies(5)} companies={showcaseCompanies()} />;
}
