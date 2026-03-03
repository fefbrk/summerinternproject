import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ROOT_URL } from '../../services/apiService';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { apiService, PressRelease } from '../../services/apiService';
import { sanitizeRichContent } from '../../lib/sanitizeHtml';

const PressReleaseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [pressRelease, setPressRelease] = useState<PressRelease | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchPressRelease = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const release = await apiService.getPressRelease(id);
        setPressRelease(release);
      } catch (err) {
        console.error('Error fetching press release:', err);
        setError('Press release not found');
      } finally {
        setLoading(false);
      }
    };

    fetchPressRelease();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-orange-50">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading press release...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !pressRelease) {
    return (
      <div className="flex flex-col min-h-screen bg-orange-50">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Press Release Not Found</h2>
            <p className="text-gray-600 mb-6">{error || 'The press release you are looking for does not exist.'}</p>
            <Link 
              to="/press-releases" 
              className="inline-flex items-center px-4 py-2 bg-kibo-purple text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Press Releases
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }



  return (
    <div className="flex flex-col min-h-screen bg-orange-50">
      <Header />
      
      <main className="flex-grow">
        {/* Press Release Header */}
        <div className="bg-gradient-to-r from-kibo-purple to-kibo-orange overflow-hidden">
          <div className="container mx-auto px-4 flex items-center h-64 overflow-hidden">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl font-bold text-white mb-4">{pressRelease.title}</h1>
              <div className="text-white/90 text-sm">
                <span>Published on {new Date(pressRelease.publishDate).toLocaleDateString('en-US')}</span>
                <span className="mx-2">•</span>
                <span>Last updated on {new Date(pressRelease.updatedAt).toLocaleDateString('en-US')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Press Release Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Breadcrumb Navigation */}
            <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
              <Link to="/press-releases" className="hover:text-kibo-purple transition-colors">Press Releases</Link>
              <span>/</span>
              <span className="text-kibo-purple font-medium">{pressRelease.title}</span>
            </nav>
            <div className="bg-purple-200 rounded-lg shadow-lg p-8">

              {/* Image Gallery Carousel */}
              {pressRelease.images && pressRelease.images.length > 0 && (
                <div className="mb-8">
                  <div className="relative h-[400px]">
                    <img
                      src={pressRelease.images[currentImageIndex].src.startsWith('http') 
                        ? pressRelease.images[currentImageIndex].src 
                        : `${ROOT_URL}${pressRelease.images[currentImageIndex].src}`}
                      alt={pressRelease.images[currentImageIndex].alt || `${pressRelease.title} - Image ${currentImageIndex + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />

                    {/* Navigation Arrows */}
                    {pressRelease.images.length > 1 && (
                      <>
                        <button
                          onClick={() => setCurrentImageIndex(prev => prev === 0 ? pressRelease.images.length - 1 : prev - 1)}
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition-colors"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setCurrentImageIndex(prev => prev === pressRelease.images.length - 1 ? 0 : prev + 1)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition-colors"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Image Dots */}
                  {pressRelease.images.length > 1 && (
                    <div className="flex justify-center space-x-2 mt-4">
                      {pressRelease.images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            index === currentImageIndex
                              ? 'bg-kibo-orange'
                              : 'bg-gray-300 hover:bg-gray-400'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="prose prose-lg max-w-none">
                <style dangerouslySetInnerHTML={{
                  __html: `
                    .prose ul {
                      list-style-type: disc;
                      margin-left: 1.5rem;
                      margin-top: 0.5rem;
                      margin-bottom: 0.5rem;
                    }
                    
                    .prose ol {
                      list-style-type: decimal;
                      margin-left: 1.5rem;
                      margin-top: 0.5rem;
                      margin-bottom: 0.5rem;
                    }
                    
                    .prose li {
                      margin-bottom: 0.25rem;
                      display: list-item;
                    }
                    
                    .prose ul li {
                      list-style-type: disc;
                    }
                    
                    .prose ol li {
                      list-style-type: decimal;
                    }
                  `
                }} />
                <div
                  className="text-gray-800 leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeRichContent(pressRelease.content)
                      .replace(/<h1[^>]*>.*?<\/h1>/gi, '')
                      .replace(/<h2[^>]*>.*?<\/h2>/gi, '')
                  }}
                />
              </div>

            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PressReleaseDetail;
