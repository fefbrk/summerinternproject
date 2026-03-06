import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartPlus } from '@fortawesome/free-solid-svg-icons';
import { useCart } from '../context/CartContext';
import { useToast } from '@/components/ui/use-toast';
import { categories, products } from '../data/products';
import KiboPhoto from '../assets/shop/kibo-shop-removebg-preview.png';
import { Search } from 'lucide-react';

const Shop = () => {
  const { category: categorySlug } = useParams<{ category?: string }>();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  const handleAddToCart = (product: (typeof products)[number]) => {
    addToCart(product);
    toast({
      title: 'Added to Cart',
      description: `${product.name} has been added to your cart.`,
    });
    setJustAddedId(product.id);
    setTimeout(() => {
      setJustAddedId((current) => (current === product.id ? null : current));
    }, 1000);
  };

  const productsToDisplay = useMemo(() => (
    categorySlug ? products.filter((product) => product.category === categorySlug) : products
  ), [categorySlug]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) {
      return productsToDisplay;
    }

    const term = searchTerm.toLowerCase().trim();
    return productsToDisplay.filter((product) => (
      product.name.toLowerCase().includes(term)
      || product.description.toLowerCase().includes(term)
      || product.category.toLowerCase().includes(term)
    ));
  }, [productsToDisplay, searchTerm]);

  const selectedCategoryData = categorySlug
    ? categories.find((category) => category.slug === categorySlug)
    : null;
  const selectedCategoryName = selectedCategoryData?.name || 'All Products';

  return (
    <div className="flex flex-col min-h-screen bg-orange-50">
      <Header />
      <main className="flex-grow">
        <div className="bg-gradient-to-r from-kibo-purple to-kibo-orange overflow-hidden">
          <div className="container mx-auto px-4 flex items-center h-64 overflow-hidden">
            <div className="w-2/3">
              <h2 className="text-3xl font-bold text-white mb-4">Which KIBO Should You Choose?</h2>
              <p className="text-white/90 mb-6">
                Trying to figure out which KIBO is right for you? KIBO 10? 15? 18? 21? Maybe you need a <strong>classroom package</strong>? Answer a few simple questions, and we’ll point you in the right direction.
              </p>
              <div className="flex gap-4">
                <Link to="/help-me-choose"><Button className="px-6 py-3 rounded-lg border border-kibo-orange text-kibo-orange bg-transparent hover:bg-kibo-purple hover:text-kibo-orange active:bg-kibo-purple active:text-kibo-orange transition-colors cursor-pointer">Help Me Choose!</Button></Link>
                <Link to="/compare-packages"><Button className="px-6 py-3 rounded-lg border border-kibo-orange text-kibo-orange bg-transparent hover:bg-kibo-purple hover:text-kibo-orange active:bg-kibo-purple active:text-kibo-orange transition-colors cursor-pointer">Compare Classroom Packages</Button></Link>
                <Link to="/compare-kits"><Button className="px-6 py-3 rounded-lg border border-kibo-orange text-kibo-orange bg-transparent hover:bg-kibo-purple hover:text-kibo-orange active:bg-kibo-purple active:text-kibo-orange transition-colors cursor-pointer">Compare KIBO Kits</Button></Link>
              </div>
            </div>
            <div className="w-1/3 flex justify-end items-center h-full">
              <img src={KiboPhoto} alt="KIBO Robot" className="max-h-[110%] w-auto object-contain" />
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 pb-8">
          <div className="flex flex-col md:flex-row gap-8 mt-8">
            <aside className="w-full md:w-1/4">
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full bg-purple-200 border-purple-200 focus:bg-orange-50 focus:border-orange-200"
                />
              </div>

              <h2 className="text-2xl font-bold mb-4">Categories</h2>
              <div className="space-y-4">
                <Link to="/shop" className="block group">
                  <div className={`rounded-2xl h-16 overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 relative flex items-end justify-center ${!categorySlug ? 'ring-4 ring-kibo-orange' : ''}`}>
                    <div className="absolute inset-0 bg-kibo-purple bg-center object-cover"></div>
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-300"></div>
                    <div className="relative w-full p-4 text-center bg-gradient-to-t from-black/80 to-transparent">
                      <h3 className="text-2xl font-bold text-white transition-colors group-hover:text-kibo-orange">All Products</h3>
                    </div>
                  </div>
                </Link>

                {categories.map((category) => (
                  <Link to={`/shop/${category.slug}`} key={category.slug} className="block group">
                    <div className={`rounded-2xl h-16 overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 relative flex items-end justify-center ${categorySlug === category.slug ? 'ring-4 ring-kibo-orange' : ''}`}>
                      <img src={category.image} alt={category.name} className="w-full h-full object-cover absolute inset-0 transition-transform duration-300 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-300"></div>
                      <div className="relative w-full p-4 text-center bg-gradient-to-t from-black/80 to-transparent">
                        <h3 className="text-2xl font-bold text-white transition-colors group-hover:text-kibo-orange">{category.name}</h3>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </aside>

            <section className="w-full md:w-3/4">
              <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2 capitalize">{selectedCategoryName}</h1>
                {selectedCategoryData && <p className="text-gray-600 leading-relaxed">{selectedCategoryData.description}</p>}
              </div>
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredProducts.map((product) => (
                    <Link to={product.detailPath} key={product.id} className="block border-2 border-kibo-purple/30 rounded-lg overflow-hidden shadow-lg transition-all duration-300 hover:border-kibo-purple hover:shadow-xl">
                      <div className="flex flex-col h-full">
                        <div className="h-48 bg-white">
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-4 flex flex-col flex-grow">
                          <h3 className="text-lg font-semibold mb-2 flex-grow">{product.name}</h3>
                          <p className="text-xl font-bold text-kibo-purple mb-1">${product.price.toFixed(2)}</p>
                          <p className="text-xs text-gray-500 mb-4">{product.id}</p>
                          <Button
                            className={`w-full transition-colors duration-100 focus:outline-none focus:ring-0 hover:shadow-none ${justAddedId === product.id ? 'bg-kibo-purple text-kibo-orange' : 'bg-kibo-orange text-white hover:bg-kibo-orange hover:text-kibo-purple'}`}
                            onClick={(e) => {
                              e.preventDefault();
                              handleAddToCart(product);
                            }}
                          >
                            <FontAwesomeIcon icon={faCartPlus} className="mr-2" />
                            {justAddedId === product.id ? 'Added to Cart' : 'Add to Cart'}
                          </Button>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p>No products found. Try a different search term or category.</p>
              )}
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Shop;
