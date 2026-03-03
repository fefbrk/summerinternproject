import { useParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartPlus } from '@fortawesome/free-solid-svg-icons';
import { useCart } from '../context/CartContext';
import { useToast } from '@/components/ui/use-toast';
import { categories, products } from '../data/products';
import KiboPhoto from '../assets/shop/kibo-shop-removebg-preview.png';
import { Search } from 'lucide-react';
import { useState } from 'react';

const Shop = () => {
  const { category: categorySlug } = useParams<{ category?: string }>();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  const handleAddToCart = (product: (typeof products)[0]) => {
    addToCart(product);
    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart.`,
    });
    setJustAddedId(product.id as string);
    setTimeout(() => {
      setJustAddedId((prev) => (prev === (product.id as string) ? null : prev));
    }, 1000);
  };

  const productsToDisplay = categorySlug
    ? products.filter(p => p.category === categorySlug)
    : products;

  // Filter products based on search term
  const filteredProducts = productsToDisplay.filter(product => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    return (
      product.name.toLowerCase().includes(term) ||
      product.description.toLowerCase().includes(term) ||
      product.category.toLowerCase().includes(term)
    );
  });

  const selectedCategoryData = categorySlug
    ? categories.find(c => c.slug === categorySlug)
    : null;

  const selectedCategoryName = selectedCategoryData?.name || 'All Products';

  return (
    <div className="flex flex-col min-h-screen bg-orange-50">
      <Header />
      <main className="flex-grow">
        {/* --- Which KIBO Should You Choose? Section --- */}
        <div className="bg-gradient-to-r from-kibo-purple to-kibo-orange overflow-hidden">
          <div className="container mx-auto px-4 flex items-center h-64 overflow-hidden">
            <div className="w-2/3">
              <h2 className="text-3xl font-bold text-white mb-4">Which KIBO Should You Choose?</h2>
              <p className="text-white/90 mb-6">
                Trying to figure out which KIBO is right for you? KIBO 10? 15? 18? 21? Maybe you need a <strong>classroom package</strong>? Answer a few simple questions, and we’ll point you in the right direction. You can also compare KIBO classroom packages (includes curriculum and training!) or KIBO Kits.
              </p>
              <div className="flex gap-4">
                <Link to="/help-me-choose">
                  <Button className="px-6 py-3 rounded-lg border border-kibo-orange text-kibo-orange bg-transparent hover:bg-kibo-purple hover:text-kibo-orange active:bg-kibo-purple active:text-kibo-orange transition-colors cursor-pointer">
                    Help Me Choose!
                  </Button>
                </Link>
                <Link to="/compare-packages">
                  <Button className="px-6 py-3 rounded-lg border border-kibo-orange text-kibo-orange bg-transparent hover:bg-kibo-purple hover:text-kibo-orange active:bg-kibo-purple active:text-kibo-orange transition-colors cursor-pointer">
                    Compare Classroom Packages
                  </Button>
                </Link>
                <Link to="/compare-kits">
                  <Button className="px-6 py-3 rounded-lg border border-kibo-orange text-kibo-orange bg-transparent hover:bg-kibo-purple hover:text-kibo-orange active:bg-kibo-purple active:text-kibo-orange transition-colors cursor-pointer">
                    Compare KIBO Kits
                  </Button>
                </Link>
              </div>
            </div>
            <div className="w-1/3 flex justify-end items-center h-full">
              <img src={KiboPhoto} alt="KIBO Robot" className="max-h-[110%] w-auto object-contain" />
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 pb-8">
          <div className="flex flex-col md:flex-row gap-8 mt-8">
            {/* Sidebar with Image Categories */}
            <aside className="w-full md:w-1/4">
              {/* Search Box */}
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
                {/* All Products Button */}
                <Link to="/shop" className="block group">
                  <div className={`rounded-2xl h-16 overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 relative flex items-end justify-center ${!categorySlug ? 'ring-4 ring-kibo-orange' : ''}`}>
                    <div className="absolute inset-0 bg-kibo-purple bg-center object-cover"></div>
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-300"></div>
                    <div className="relative w-full p-4 text-center bg-gradient-to-t from-black/80 to-transparent">
                      <h3 className="text-2xl font-bold text-white transition-colors group-hover:text-kibo-orange">
                        All Products
                      </h3>
                    </div>
                  </div>
                </Link>

                {/* Category Buttons */}
                {categories.map(cat => (
                  <Link to={`/shop/${cat.slug}`} key={cat.slug} className="block group">
                    <div className={`rounded-2xl h-16 overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 relative flex items-end justify-center ${categorySlug === cat.slug ? 'ring-4 ring-kibo-orange' : ''}`}>
                      <img src={cat.image} alt={cat.name} className="w-full h-full object-cover absolute inset-0 transition-transform duration-300 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-300"></div>
                      <div className="relative w-full p-4 text-center bg-gradient-to-t from-black/80 to-transparent">
                        <h3 className="text-2xl font-bold text-white transition-colors group-hover:text-kibo-orange">
                          {cat.name}
                        </h3>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </aside>

            {/* Products Grid */}
            <section className="w-full md:w-3/4">
              <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2 capitalize">
                  {selectedCategoryName}
                </h1>
                {selectedCategoryData && (
                  <p className="text-gray-600 leading-relaxed">
                    {selectedCategoryData.description}
                  </p>
                )}
              </div>
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredProducts.map(product => (
                    <Link to={
                      product.id === '1' ? '/products/kibo-10-kit' :
                        product.id === '2' ? '/products/kibo-15-kit' :
                          product.id === '3' ? '/products/kibo-18-kit' :
                            product.id === '4' ? '/products/kibo-21-kit' :
                              product.id === '801' ? '/products/kibo-10-home-edition' :
                                product.id === '802' ? '/products/kibo-15-home-edition' :
                                  product.id === '101' ? '/products/activity-center-kibo-21-steam-explorer' :
                                    product.id === '102' ? '/products/small-classroom-kibo-21-steam-explorer' :
                                      product.id === '103' ? '/products/full-classroom-kibo-21-steam-explorer' :
                                        product.id === '104' ? '/products/activity-center-kibo-21' :
                                          product.id === '105' ? '/products/small-classroom-kibo-21' :
                                            product.id === '106' ? '/products/full-classroom-kibo-21' :
                                              product.id === '107' ? '/products/activity-center-kibo-18' :
                                                product.id === '108' ? '/products/small-classroom-kibo-18' :
                                                  product.id === '109' ? '/products/full-classroom-kibo-18' :
                                                    product.id === '201' ? '/products/advanced-coding-extension-set' :
                                                      product.id === '202' ? '/products/building-brick-extension-set-basic' :
                                                        product.id === '203' ? '/products/building-brick-extension-set-deluxe' :
                                                          product.id === '204' ? '/products/bundle-of-fun-extension-package' :
                                                            product.id === '205' ? '/products/expression-module' :
                                                              product.id === '206' ? '/products/free-throw-extension-set' :
                                                                product.id === '207' ? '/products/kibo-18-to-kibo-21-upgrade-package' :
                                                                  product.id === '208' ? '/products/kibo-costumes' :
                                                                    product.id === '209' ? '/products/marker-extension-set' :
                                                                      product.id === '210' ? '/products/marker-extension-set-extras' :
                                                                        product.id === '211' ? '/products/sound-record-playback-module' :
                                                                          product.id === '301' ? '/products/beep-block' :
                                                                            product.id === '302' ? '/products/begin-and-end-blocks' :
                                                                              product.id === '303' ? '/products/block-sticker-upgrade' :
                                                                                product.id === '304' ? '/products/block-sticker-upgrade-for-kibo-18' :
                                                                                  product.id === '305' ? '/products/block-sticker-upgrade-for-kibo-21' :
                                                                                    product.id === '306' ? '/products/clap-sound-sensor-ear' :
                                                                                      product.id === '307' ? '/products/conditional-blocks' :
                                                                                        product.id === '308' ? '/products/distance-sensor-telescope' :
                                                                                          product.id === '309' ? '/products/firmware-update-cable' :
                                                                                            product.id === '310' ? '/products/forward-block' :
                                                                                              product.id === '311' ? '/products/if-and-end-if-blocks' :
                                                                                                product.id === '312' ? '/products/light-on-blocks' :
                                                                                                  product.id === '313' ? '/products/light-output-sensor-lightbulb' :
                                                                                                    product.id === '314' ? '/products/light-sensor-eye' :
                                                                                                      product.id === '315' ? '/products/motion-blocks' :
                                                                                                        product.id === '316' ? '/products/motor-module' :
                                                                                                          product.id === '317' ? '/products/parameters-for-if-then-blocks' :
                                                                                                            product.id === '318' ? '/products/parameters-for-repeat-blocks' :
                                                                                                              product.id === '319' ? '/products/parameters-for-repeat-blocks-numbers-only' :
                                                                                                                product.id === '320' ? '/products/sing-block' :
                                                                                                                  product.id === '321' ? '/products/spin-block' :
                                                                                                                    product.id === '322' ? '/products/stage-art-platform' :
                                                                                                                      product.id === '323' ? '/products/stage-pedestal' :
                                                                                                                        product.id === '324' ? '/products/stage-support' :
                                                                                                                          product.id === '325' ? '/products/turntable-art-platform' :
                                                                                                                            product.id === '326' ? '/products/wait-for-clap-block' :
                                                                                                                              product.id === '327' ? '/products/wheel' :
                                                                                                                                product.id === '401' ? '/products/growing-with-kibo' :
                                                                                                                                  product.id === '402' ? '/products/exploring-with-kibo' :
                                                                                                                                    product.id === '403' ? '/products/kibo-coding-cards' :
                                                                                                                                      product.id === '404' ? '/products/activity-center-guidebook' :
                                                                                                                                        product.id === '405' ? '/products/creating-with-kibo-guide' :
                                                                                                                                          product.id === '406' ? '/products/kibo-activity-cards' :
                                                                                                                                            product.id === '407' ? '/products/kibo-says-game' :
                                                                                                                                              product.id === '408' ? '/products/ask-and-imagine-guide' :
                                                                                                                                                product.id === '409' ? '/products/assessment-workbook' :
                                                                                                                                                  product.id === '410' ? '/products/blended-learning-bundle' :
                                                                                                                                                    product.id === '411' ? '/products/build-it-better-guide' :
                                                                                                                                                      product.id === '412' ? '/products/engineering-design-journals' :
                                                                                                                                                        product.id === '413' ? '/products/express-yourself-guide' :
                                                                                                                                                          product.id === '414' ? '/products/make-learning-visible-guide' :
                                                                                                                                                            product.id === '415' ? '/products/module-curriculum-guides-bundle' :
                                                                                                                                                              product.id === '416' ? '/products/showtime-with-kibo-guide' :
                                                                                                                                                                product.id === '417' ? '/products/teaching-materials-package' :
                                                                                                                                                                  product.id === '418' ? '/products/two-posters' :
                                                                                                                                                                    product.id === '419' ? '/products/kibo-home-robotics-guide' :
                                                                                                                                                                      product.id === '501' ? '/products/training-one-hour-web-conference' :
                                                                                                                                                                        product.id === '601' ? '/products/activity-cards-1st-edition-clearance' :
                                                                                                                                                                          product.id === '602' ? '/products/assessment-workbook-1st-edition-clearance' :
                                                                                                                                                                            product.id === '603' ? '/products/build-it-better-clearance' :
                                                                                                                                                                              product.id === '604' ? '/products/express-yourself-clearance' :
                                                                                                                                                                                product.id === '605' ? '/products/make-learning-visible-clearance' :
                                                                                                                                                                                  product.id === '606' ? '/products/showtime-with-kibo-clearance' :
                                                                                                                                                                                    product.id === '701' ? '/products/kibo-repair-service' :
                                                                                                                                                                                      `/product/${product.id}`
                    } key={product.id} className="block border-2 border-kibo-purple/30 rounded-lg overflow-hidden shadow-lg transition-all duration-300 hover:border-kibo-purple hover:shadow-xl">
                      <div className="flex flex-col h-full">
                        <div className="h-48 bg-white">
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-4 flex flex-col flex-grow">
                          <h3 className="text-lg font-semibold mb-2 flex-grow">{product.name}</h3>
                          <p className="text-xl font-bold text-kibo-purple mb-4">
                            {`$${product.price.toFixed(2)}`}
                          </p>
                          <Button
                            className={`w-full transition-colors duration-100 focus:outline-none focus:ring-0 hover:shadow-none ${(justAddedId === product.id)
                              ? 'bg-kibo-purple text-kibo-orange'
                              : 'bg-kibo-orange text-white hover:bg-kibo-orange hover:text-kibo-purple'
                              }`}
                            onClick={(e) => {
                              e.preventDefault(); // Prevent navigation when clicking the button
                              handleAddToCart(product);
                            }}
                          >
                            <FontAwesomeIcon icon={faCartPlus} className="mr-2" />
                            {(justAddedId === product.id) ? 'Added to Cart' : 'Add to Cart'}
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
