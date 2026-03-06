import { useParams, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Button } from '@/components/ui/button';
import { useCart } from '../context/CartContext';
import { useToast } from '@/components/ui/use-toast';
import { categories, getProductById, getProductBySlug } from '../data/products';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartPlus } from '@fortawesome/free-solid-svg-icons';

const ProductDetail = () => {
  const { id, slug } = useParams<{ id?: string; slug?: string }>();
  const { addToCart } = useCart();
  const { toast } = useToast();

  const product = slug ? getProductBySlug(slug) : (id ? getProductById(id) : null);

  if (!product) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 text-center">
          <h1 className="text-3xl font-bold mb-4">Product Not Found</h1>
          <p className="mb-6">We couldn't find the product you're looking for.</p>
          <Link to="/shop">
            <Button>Back to Shop</Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart(product);
    toast({
      title: 'Added to Cart',
      description: `${product.name} has been added to your cart.`,
    });
  };

  const productCategory = categories.find((category) => category.slug === product.category);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-6 text-sm text-gray-500">
          <Link to="/shop" className="hover:text-kibo-orange">Shop</Link>
          {' / '}
          {productCategory && (
            <Link to={`/shop/${productCategory.slug}`} className="hover:text-kibo-orange capitalize">
              {productCategory.name}
            </Link>
          )}
          {' / '}
          <span className="font-semibold">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="flex items-center justify-center bg-white rounded-lg border p-8">
            <img src={product.image} alt={product.name} className="max-h-[400px] object-contain" />
          </div>

          <div>
            <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
            <p className="text-3xl font-bold text-kibo-purple mb-6">${product.price.toFixed(2)}</p>
            <p className="text-gray-700 leading-relaxed mb-4">{product.description}</p>
            <p className="text-sm text-gray-500 mb-8">Product ID: {product.id}</p>
            <Button size="lg" className="w-full md:w-auto bg-kibo-orange hover:bg-kibo-orange/90" onClick={handleAddToCart}>
              <FontAwesomeIcon icon={faCartPlus} className="mr-2" />
              Add to Cart
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;
