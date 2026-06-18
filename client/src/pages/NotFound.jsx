import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <p className="font-mono text-cyan text-sm mb-2">ERROR 404</p>
      <h1 className="font-display text-3xl font-bold text-ink-1 mb-3">Page not found</h1>
      <p className="text-ink-3 mb-6 max-w-sm">
        The page you're looking for doesn't exist or may have moved.
      </p>
      <Link to="/">
        <Button>Back to store</Button>
      </Link>
    </div>
  );
}
