import { LandingPage } from '@/components/marketing/LandingPage';

interface PageParams {
  params: {
    locale: string;
  };
}

export default function LocalizedLandingPage({ params }: PageParams) {
  return <LandingPage locale={params.locale} />;
}
