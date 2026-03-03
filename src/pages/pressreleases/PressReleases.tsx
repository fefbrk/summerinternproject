import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ROOT_URL } from '@/services/apiService';


import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { apiService, PressRelease } from '../../services/apiService';

const PressReleases = () => {
  const [pressReleases, setPressReleases] = useState<PressRelease[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPressReleases = async () => {
      try {
        setIsLoading(true);
        const releases = await apiService.getAllPressReleases({ limit: 1000 });
        // Sadece yayınlanmış press release'leri göster
        const publishedReleases = releases.filter(release => release.status === 'published');
        setPressReleases(publishedReleases);
      } catch (err) {
        console.error('Error fetching press releases:', err);
        setError('An error occurred while loading press releases.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPressReleases();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-orange-50">
      <Header />
      <main className="flex-grow">
        {/* --- Press Releases Banner Section --- */}
        <div className="bg-gradient-to-r from-kibo-purple to-kibo-orange overflow-hidden">
          <div className="container mx-auto px-4 flex items-center h-64 overflow-hidden">
            <div className="w-full text-center">
              <h2 className="text-3xl font-bold text-white mb-4">Press Releases</h2>
              <p className="text-white/90">
                Stay informed with the latest official announcements and news from KIBO
              </p>
            </div>
          </div>
        </div>

        {/* --- Content Section --- */}
        <div className="container mx-auto px-4 py-8">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 text-lg">{error}</p>
            </div>
          ) : pressReleases.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No press releases available</h3>
              <p className="text-gray-500">Check back later for new content!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {pressReleases.map((release) => (
                <Link 
                  key={release.id} 
                  to={`/press-releases/${release.id}`}
                  className="block"
                >
                  <div className="bg-purple-200 rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow cursor-pointer h-full flex flex-col">
                    {/* Press Release Image */}
                    <div className="relative h-48 flex-shrink-0">
                      {release.images && release.images.length > 0 ? (
                        <>
                          <img
                            src={release.images[0].src.startsWith('http') ? release.images[0].src : `${ROOT_URL}${release.images[0].src}`}
                            alt={release.title}
                            className="w-full h-full object-cover"
                          />
                          {/* Dark overlay */}
                          <div className="absolute inset-0 bg-black bg-opacity-75"></div>
                          {/* Title overlay */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <h3 className="text-xl font-bold text-kibo-orange text-center px-4 drop-shadow-lg">{release.title}</h3>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-kibo-purple to-kibo-orange flex items-center justify-center">
                          <h3 className="text-xl font-bold text-white text-center px-4">{release.title}</h3>
                        </div>
                      )}
                      {/* Category Tag */}
                      <div className="absolute top-2 right-2">
                        <div className="bg-kibo-orange text-white px-2 py-1 rounded text-xs font-semibold">
                          Press Release
                        </div>
                      </div>
                    </div>

                    {/* Press Release Content */}
                    <div className="p-4 flex-grow">
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {release.excerpt || release.content.replace(/<[^>]*>/g, '').substring(0, 150) + '...'}
                      </p>
                    </div>
                    
                    {/* Date Information */}
                    <div className="px-4 pb-4 flex-shrink-0">
                      <div className="flex justify-between items-center text-gray-500 text-sm border-t border-gray-200 pt-3">
                        <span title={`Published on ${formatDate(release.publishDate)}`}>Published: {formatDate(release.publishDate)}</span>
                        <span title={`Last updated on ${formatDate(release.updatedAt)}`}>Updated: {formatDate(release.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PressReleases;
