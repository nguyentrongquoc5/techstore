import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { wishlistService } from '../services/wishlistService';
import ProductCard from '../components/product/ProductCard';
import EmptyState from '../components/common/EmptyState';
import Loading from '../components/common/Loading';
import type { Product } from '../types';
import { usePageTitle } from '../hooks/usePageTitle';

export default function WishlistPage() {
  usePageTitle('Yêu thích');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    wishlistService
      .getAll()
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-6">
        <Heart size={24} className="text-red-500" />
        <h1 className="text-2xl font-bold">Yêu thích</h1>
        <span className="text-sm text-gray-500">({products.length})</span>
      </div>

      {products.length === 0 ? (
        <EmptyState
          title="Chưa có sản phẩm yêu thích"
          description="Hãy thêm sản phẩm vào danh sách yêu thích để xem lại sau."
          actionLabel="Xem sản phẩm"
          actionTo="/san-pham"
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
