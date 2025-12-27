import ReviewsPage from '../../components/ReviewsPage';

export default async function AppIdPage({ params }: { params: Promise<{ appId: string }> }) {
  const { appId } = await params;
  return <ReviewsPage initialAppId={appId} initialPages={50} />;
}
