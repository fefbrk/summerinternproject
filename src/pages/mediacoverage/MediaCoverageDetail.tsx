import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ROOT_URL } from '../../services/apiService';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { apiService, type MediaCoverage } from '../../services/apiService';
import { sanitizeRichContent } from '../../lib/sanitizeHtml';

const MediaCoverageDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [mediaCoverage, setMediaCoverage] = useState<MediaCoverage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchMediaCoverage = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const coverage = await apiService.getMediaCoverage(id);
        setMediaCoverage(coverage);
      } catch (err) {
        console.error('Error fetching media coverage:', err);
        setError('Media coverage not found');
      } finally {
        setLoading(false);
      }
    };

    fetchMediaCoverage();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-orange-50">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading media coverage...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !mediaCoverage) {
    return (
      <div className="flex flex-col min-h-screen bg-orange-50">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Media Coverage Not Found</h2>
            <p className="text-gray-600 mb-6">{error || 'The media coverage you are looking for does not exist.'}</p>
            <Link 
              to="/media-coverage" 
              className="inline-flex items-center px-4 py-2 bg-kibo-purple text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Media Coverage
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
        {/* Media Coverage Header */}
        <div className="bg-gradient-to-r from-kibo-purple to-kibo-orange overflow-hidden">
          <div className="container mx-auto px-4 flex items-center h-64 overflow-hidden">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl font-bold text-white mb-4">{mediaCoverage.title}</h1>
              <div className="text-white/90 text-sm">
                <span>Published on {new Date(mediaCoverage.publishDate).toLocaleDateString('en-US')}</span>
                <span className="mx-2">•</span>
                <span>Last updated on {new Date(mediaCoverage.updatedAt).toLocaleDateString('en-US')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Media Coverage Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Breadcrumb Navigation */}
            <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
              <Link to="/media-coverage" className="hover:text-kibo-purple transition-colors">Media Coverage</Link>
              <span>/</span>
              <span className="text-kibo-purple font-medium">{mediaCoverage.title}</span>
            </nav>
            <div className="bg-purple-200 rounded-lg shadow-lg p-8">

              {/* Image Gallery Carousel */}
              {mediaCoverage.images && mediaCoverage.images.length > 0 && (
                <div className="mb-8">
                  <div className="relative h-[400px]">
                    <img
                      src={mediaCoverage.images[currentImageIndex].src.startsWith('http') 
                        ? mediaCoverage.images[currentImageIndex].src 
                        : `${ROOT_URL}${mediaCoverage.images[currentImageIndex].src}`}
                      alt={mediaCoverage.images[currentImageIndex].alt || `${mediaCoverage.title} - Image ${currentImageIndex + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />

                    {/* Navigation Arrows */}
                    {mediaCoverage.images.length > 1 && (
                      <>
                        <button
                          onClick={() => setCurrentImageIndex(prev => prev === 0 ? mediaCoverage.images.length - 1 : prev - 1)}
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition-colors"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setCurrentImageIndex(prev => prev === mediaCoverage.images.length - 1 ? 0 : prev + 1)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition-colors"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Image Dots */}
                  {mediaCoverage.images.length > 1 && (
                    <div className="flex justify-center space-x-2 mt-4">
                      {mediaCoverage.images.map((_, index) => (
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
                    __html: sanitizeRichContent(mediaCoverage.content)
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

export default MediaCoverageDetail;
