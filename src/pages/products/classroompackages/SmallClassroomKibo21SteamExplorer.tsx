import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductIdMeta from '@/components/shop/ProductIdMeta';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import { ChevronRight, Search } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartPlus } from '@fortawesome/free-solid-svg-icons';
import { products } from '@/data/products';

// Import images
import MainImg from '@/assets/product/classroompackages/smallclassroomkibo21steam/STEAM-explorer-SCP-21.webp';
import KiboImg from '@/assets/product/classroompackages/smallclassroomkibo21steam/KIBO-120519_9358.jpg';
import CurriculumImg from '@/assets/product/classroompackages/smallclassroomkibo21steam/curriculum-image.jpg';

const SmallClassroomKibo21SteamExplorer = () => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [justAdded, setJustAdded] = useState(false);
  const [minusClicked, setMinusClicked] = useState(false);
  const [plusClicked, setPlusClicked] = useState(false);
  const { addToCart, cartItems, updateQuantity } = useCart();
  const { toast } = useToast();
  
  // Get the current quantity of this product in the cart
  const productInCart = cartItems.find(item => item.id === '102');
  const quantity = productInCart ? productInCart.quantity : 0;

  const images = [
    MainImg,
    KiboImg,
    CurriculumImg
  ];

  const handleAddToCart = () => {
    const product = products.find(p => p.id === '102');
    if (product) {
      addToCart(product);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1000);
    }
    
    toast({
      title: "Added to cart",
      description: "Small Classroom KIBO 21 STEAM Explorer Package added to your cart.",
    });
  };

  const getPrice = () => {
    const product = products.find(p => p.id === '102');
    return product ? `$${product.price.toFixed(2)}` : '$6245.00';
  };

  return (
    <div className="min-h-screen bg-orange-50">
      <Header />
      
      {/* Product Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <Link to="/shop" className="hover:text-kibo-purple transition-colors">Shop KIBO</Link>
          <span>/</span>
          <Link to="/shop/kibo-classroom-packages" className="hover:text-kibo-purple transition-colors">Classroom Packages</Link>
          <span>/</span>
          <span className="text-kibo-purple font-medium">Small Classroom KIBO 21 STEAM Explorer Package</span>
        </nav>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
             <div className="relative bg-white border rounded-lg overflow-hidden group">
               <button 
                 onClick={() => setIsModalOpen(true)}
                 className="absolute top-4 right-4 z-10 bg-gradient-to-r from-kibo-purple to-kibo-orange text-white rounded-full p-2 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110"
               >
                 <Search className="h-5 w-5" />
               </button>
               <img
                 src={images[selectedImage]}
                 alt="Small Classroom KIBO 21 STEAM Explorer Package"
                 className="w-full h-96 object-cover cursor-pointer transition-transform duration-300 hover:scale-150"
                 onClick={() => setIsModalOpen(true)}
                 onMouseMove={(e) => {
                   const rect = e.currentTarget.getBoundingClientRect();
                   const x = ((e.clientX - rect.left) / rect.width) * 100;
                   const y = ((e.clientY - rect.top) / rect.height) * 100;
                   e.currentTarget.style.transformOrigin = `${x}% ${y}%`;
                 }}
               />
             </div>
            
            {/* Thumbnail Images */}
            <div className="flex space-x-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`w-20 h-20 border-2 rounded-lg overflow-hidden ${
                    selectedImage === index ? 'border-purple-500' : 'border-gray-200'
                  }`}
                >
                  <img
                    src={image}
                    alt={`Small Classroom KIBO 21 STEAM Explorer Package view ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Information */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-kibo-purple mb-4">Small Classroom KIBO 21 STEAM Explorer Package</h1>
              
              <div className="text-2xl font-bold text-gray-900 mb-4">{getPrice()}</div>
            </div>

            {/* Quantity and Add to Cart */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden flex-shrink-0">
                <button
                  onClick={() => {
                    if (quantity > 0) {
                      updateQuantity('102', quantity - 1);
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
                      // If quantity is 0, trigger add to cart functionality
                      handleAddToCart();
                    } else {
                      // Otherwise, just update the quantity
                      updateQuantity('102', quantity + 1);
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

            {/* Product Meta */}
            <div className="text-sm text-gray-500 space-y-1">
              <div><span className="font-medium">SKU:</span> SCP21STEAM</div>
              <ProductIdMeta />
              <div><span className="font-medium">Category:</span> <Link to="/shop/kibo-classroom-packages" className="text-purple-600 hover:underline">Classroom Packages</Link></div>
            </div>
          </div>
        </div>

        {/* Product Tabs */}
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
                  Our classroom packages give you the <strong>right number of KIBOs, valuable training, hours of curriculum, workbooks, and more!</strong> Classroom Packages are <strong>priced at a 5% discount</strong> compared to buying a la carte.
                <br></br><br></br>
                <p>For schools looking to maximize the impact of their investment in KIBO, we are pleased to offer the new <strong>STEAM Explorer</strong> classroom package bundle that combines the KIBO 21 Robot Kit with all of our fun, diverse extension sets into a unified package. <strong>Every extension set</strong> and <strong>every lesson</strong> we’ve created, core and supplemental, is included – and at a significant discount! With the STEAM Explorer classroom package, you’ll make the most of your investment in KIBO by ensuring you have the widest possible range of activities and curriculum to reach all students from PreK to 5th grade.
<br></br><br></br>The KIBO 21 Small Classroom Package is designed to serve <strong>10 to 12 students with 5 KIBO 21 robot kits</strong>, and is perfect for a small classroom or sharing between classrooms. This package includes:</p>
              
              <br></br>
               <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                  <li>5 KIBO 21 kits</li>
                  <li>5 Marker Extension Sets: integrate art and geometry by programming KIBO to draw</li>
                  <li>5 Building Brick Extension Sets: build with LEGO-compatible bricks to integrate engineering and imagination play</li>
                  <li>5 Free Throw Extension Sets: explore physics and measurement with a programmable throwing arm</li>
                  <li>5 Advanced Coding Extension Sets: extend into upper elementary coding concepts with new KIBO blocks</li>
                  <li>Pack of 12 Engineering Design Journals</li>
                  <li>Pack of 12 Assessment Workbooks</li>
                  <li>Activity Guide Cards</li>
                  <li>Growing with KIBO PreK-2 Core Curriculum</li>
                  <li>Exploring with KIBO Grade 3-5 Core Curriculum</li>
               
                   <li>“KIBO Says”, class programming game</li>
                    <li>KIBO Coding Cards (1 per KIBO kit)</li>
                     <li>Two posters: KIBO and Engineering Process</li>
                      <li>Two hours of Professional Development for one teacher via web-conference*</li>
                </ul>
              
              <p>* The included training is provided as two “seats” in one-hour web conference sessions. These are live workshops with our trainers. Training must be used within 1 year of purchase date.</p>
              
              
              
              
              
              
              
              
              
              
              
              
              
              
              
              </p>






              </div>
            )}

            {activeTab === 'additional' && (
              <div>
                <h2 className="text-2xl font-bold text-kibo-purple mb-6">Additional information</h2>
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <tbody>
                      <tr className="border-b border-gray-200">
                        <td className="px-6 py-4 font-medium text-gray-900 bg-gray-100 w-1/3">Weight</td>
                        <td className="px-6 py-4 text-gray-700 w-2/3">70 lbs</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 font-medium text-gray-900 bg-gray-100 w-1/3">Dimensions</td>
                        <td className="px-6 py-4 text-gray-700 w-2/3">17 × 24 × 24 in</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Modal */}
       {isModalOpen && (
         <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setIsModalOpen(false)}>
           <div className="relative max-w-4xl max-h-[90vh] p-4">
             <button 
               onClick={() => setIsModalOpen(false)}
               className="absolute -top-4 -right-4 bg-gradient-to-r from-kibo-purple to-kibo-orange text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 z-10"
             >
               <span className="font-bold text-lg">×</span>
             </button>
             <img
                src={images[selectedImage]}
                alt="Small Classroom KIBO 21 STEAM Explorer Package - Enlarged"
                className="max-w-full max-h-full object-contain rounded-lg"
              />
           </div>
         </div>
       )}
      
      <Footer />
    </div>
  );
};

export default SmallClassroomKibo21SteamExplorer;