import { useParams } from 'react-router-dom';
import PageSkeleton from './PageSkeleton';

// Renders a single page skeleton so the boneyard CLI can snapshot it (dev only).
export default function SkeletonPreview() {
  const { variant } = useParams();
  return <PageSkeleton variant={variant} />;
}
