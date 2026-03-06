import { useLocation } from 'react-router-dom';
import { getProductByDetailPath } from '@/data/products';

type ProductIdMetaProps = {
  productId?: string;
};

const ProductIdMeta = ({ productId }: ProductIdMetaProps) => {
  const location = useLocation();
  const resolvedProductId = productId ?? getProductByDetailPath(location.pathname)?.id;

  if (!resolvedProductId) {
    return null;
  }

  return (
    <div>
      <span className="font-medium">Product ID:</span> #{resolvedProductId}
    </div>
  );
};

export default ProductIdMeta;
