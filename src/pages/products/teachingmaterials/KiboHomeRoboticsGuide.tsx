import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductIdMeta from '@/components/shop/ProductIdMeta';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import { Search } from 'lucide-react';
import { products } from '@/data/products';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartPlus } from '@fortawesome/free-solid-svg-icons';

import MainImg from '@/assets/kibo/athome/home-resource1-225x300.jpg';
import AltImgOne from '@/assets/kibo/athome/home-resource1-1-225x300.jpg';
import AltImgTwo from '@/assets/kibo/athome/home-resource2-1-225x300.jpg';
import AltImgThree from '@/assets/kibo/athome/home-resource3-1-225x300.jpg';

const KiboHomeRoboticsGuide = () => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [justAdded, setJustAdded] = useState(false);
  const [minusClicked, setMinusClicked] = useState(false);
  const [plusClicked, setPlusClicked] = useState(false);
  const { addToCart, cartItems, updateQuantity } = useCart();
  const { toast } = useToast();

  const productInCart = cartItems.find((item) => item.id === '419');
  const quantity = productInCart ? productInCart.quantity : 0;

  const images = [MainImg, AltImgOne, AltImgTwo, AltImgThree];

  const handleAddToCart = () => {
    const product = products.find((p) => p.id === '419');
    if (product) {
      addToCart(product);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1000);
    }

    toast({
      title: 'Added to cart',
      description: 'KIBO Home Robotics Guide added to your cart.',
    });
  };

  const getPrice = () => {
    const product = products.find((p) => p.id === '419');
    return product ? `$${product.price.toFixed(2)}` : '$800.00';
  };

  return (
    <div className="min-h-screen bg-orange-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <Link to="/shop" className="hover:text-kibo-purple transition-colors">Shop KIBO</Link>
          <span>/</span>
          <Link to="/shop/learning-materials" className="hover:text-kibo-purple transition-colors">Teaching Materials</Link>
          <span>/</span>
          <span className="text-kibo-purple font-medium">KIBO Home Robotics Guide</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            <div className="relative bg-white border rounded-lg overflow-hidden group">
              <button
                onClick={() => setIsModalOpen(true)}
                className="absolute top-4 right-4 z-10 bg-gradient-to-r from-kibo-purple to-kibo-orange text-white rounded-full p-2 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110"
              >
                <Search className="h-5 w-5" />
              </button>
              <img
                src={images[selectedImage]}
                alt="KIBO Home Robotics Guide"
                className="w-full h-96 object-contain bg-white cursor-pointer transition-transform duration-300 hover:scale-150"
                onClick={() => setIsModalOpen(true)}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  const y = ((e.clientY - rect.top) / rect.height) * 100;
                  e.currentTarget.style.transformOrigin = `${x}% ${y}%`;
                }}
              />
            </div>

            <div className="flex space-x-2 flex-wrap">
              {images.map((image, index) => (
                <button
                  key={image}
                  onClick={() => setSelectedImage(index)}
                  className={`w-20 h-20 border-2 rounded-lg overflow-hidden ${
                    selectedImage === index ? 'border-purple-500' : 'border-gray-200'
                  }`}
                >
                  <img
                    src={image}
                    alt={`KIBO Home Robotics Guide view ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-kibo-purple mb-4">KIBO Home Robotics Guide</h1>
              <div className="text-2xl font-bold text-gray-900 mb-4">{getPrice()}</div>
              <p className="text-gray-700 leading-relaxed">
                A home-friendly KIBO curriculum booklet that helps families and homeschools bring
                coding, robotics, and engineering into everyday learning.
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden flex-shrink-0">
                <button
                  onClick={() => {
                    if (quantity > 0) {
                      updateQuantity('419', quantity - 1);
                      setMinusClicked(true);
                      setTimeout(() => setMinusClicked(false), 1000);
                    }
                  }}
                  className={`px-3 py-2 transition-colors duration-100 focus:outline-none focus:ring-0 hover:shadow-none ${
                    minusClicked
                      ? 'bg-kibo-purple text-kibo-orange'
                      : 'bg-kibo-orange text-white hover:bg-kibo-orange hover:text-kibo-purple'
                  }`}
                >-</button>
                <span className="px-3 py-2 min-w-[2.5rem] text-center">{quantity}</span>
                <button
                  onClick={() => {
                    if (quantity === 0) {
                      handleAddToCart();
                    } else {
                      updateQuantity('419', quantity + 1);
                    }
                    setPlusClicked(true);
                    setTimeout(() => setPlusClicked(false), 1000);
                  }}
                  className={`px-3 py-2 transition-colors duration-100 focus:outline-none focus:ring-0 hover:shadow-none ${
                    plusClicked
                      ? 'bg-kibo-purple text-kibo-orange'
                      : 'bg-kibo-orange text-white hover:bg-kibo-orange hover:text-kibo-purple'
                  }`}
                >+</button>
              </div>

              <Button
                onClick={handleAddToCart}
                className={`w-full transition-colors duration-100 focus:outline-none focus:ring-0 hover:shadow-none ${
                  justAdded
                    ? 'bg-kibo-purple text-kibo-orange'
                    : 'bg-kibo-orange text-white hover:bg-kibo-orange hover:text-kibo-purple'
                }`}
              >
                <FontAwesomeIcon icon={faCartPlus} className="mr-2" />
                {justAdded ? 'Added to Cart' : 'Add to Cart'}
              </Button>
            </div>

            <div className="text-sm text-gray-500 space-y-1">
              <div><span className="font-medium">SKU:</span> TM-HOME-GUIDE</div>
              <ProductIdMeta />
              <div><span className="font-medium">Category:</span> <Link to="/shop/learning-materials" className="text-purple-600 hover:underline">Teaching Materials</Link></div>
            </div>
          </div>
        </div>

        <div className="mt-16">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('description')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'description'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Description
              </button>
              <button
                onClick={() => setActiveTab('additional')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'additional'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Additional information
              </button>
            </nav>
          </div>

          <div className="py-8 min-h-[400px]">
            {activeTab === 'description' && (
              <div className="prose max-w-none">
                <h2 className="text-2xl font-bold text-kibo-purple mb-6">Description</h2>
                <p className="text-gray-700 mb-4">
                  The KIBO Home Robotics Guide is designed for families, caregivers, and homeschool
                  educators who want a clearer path into screen-free robotics at home.
                </p>
                <p className="text-gray-700 mb-4">
                  It explains the scope and sequence of the home robotics course, offers practical
                  teaching tips for home-based learning, and helps adults guide children through
                  coding, engineering, and creative problem-solving with confidence.
                </p>
                <p className="text-gray-700 mb-4">
                  The guide pairs especially well with a KIBO robot kit, Creating with KIBO, and
                  KIBO Activity Cards to create a well-rounded home learning experience.
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                  <li>Scope and sequence support for home robotics lessons</li>
                  <li>Tips tailored to homes and homeschools</li>
                  <li>Guidance for introducing coding and engineering concepts</li>
                  <li>Designed to support project-based, open-ended learning</li>
                </ul>
              </div>
            )}

            {activeTab === 'additional' && (
              <div>
                <h2 className="text-2xl font-bold text-kibo-purple mb-6">Additional information</h2>
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <tbody>
                      <tr className="border-b border-gray-200">
                        <td className="px-6 py-4 font-medium text-gray-900 bg-gray-100 w-1/3">Format</td>
                        <td className="px-6 py-4 text-gray-700 w-2/3">Printed curriculum booklet</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="px-6 py-4 font-medium text-gray-900 bg-gray-100 w-1/3">Audience</td>
                        <td className="px-6 py-4 text-gray-700 w-2/3">Families, caregivers, and homeschools</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 font-medium text-gray-900 bg-gray-100 w-1/3">Pairs well with</td>
                        <td className="px-6 py-4 text-gray-700 w-2/3">KIBO kits, Creating with KIBO, and KIBO Activity Cards</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setIsModalOpen(false)}>
          <div className="relative max-w-4xl max-h-[90vh] p-4">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute -top-4 -right-4 bg-gradient-to-r from-kibo-purple to-kibo-orange text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 z-10"
            >
              <span className="font-bold text-lg">x</span>
            </button>
            <img
              src={images[selectedImage]}
              alt="KIBO Home Robotics Guide - Enlarged"
              className="max-w-full max-h-full object-contain rounded-lg bg-white"
            />
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default KiboHomeRoboticsGuide;
