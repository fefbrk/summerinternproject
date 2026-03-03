import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import apiService, { BlogPost } from '../../services/apiService';
import { sanitizeRichContent } from '../../lib/sanitizeHtml';

const BlogPostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [blogPost, setBlogPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchBlogPost = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const post = await apiService.getBlogPost(id);
        setBlogPost(post);
      } catch (err) {
        console.error('Error fetching blog post:', err);
        setError('Blog post not found');
      } finally {
        setLoading(false);
      }
    };

    fetchBlogPost();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-orange-50">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading blog post...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !blogPost) {
    return (
      <div className="flex flex-col min-h-screen bg-orange-50">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Blog Post Not Found</h1>
            <p className="text-gray-600 mb-6">The blog post you're looking for doesn't exist or has been removed.</p>
            <Link 
              to="/blog"
              className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
            >
              Back to Blog
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
        {/* Blog Post Header */}
        <div className="bg-gradient-to-r from-kibo-purple to-kibo-orange overflow-hidden">
          <div className="container mx-auto px-4 flex items-center h-64 overflow-hidden">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl font-bold text-white mb-4">{blogPost.title}</h1>
              <div className="text-white/90 text-sm">
                <span>Published on {new Date(blogPost.publishDate).toLocaleDateString('en-US')}</span>
                <span className="mx-2">•</span>
                <span>Last updated on {new Date(blogPost.updatedAt).toLocaleDateString('en-US')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Blog Post Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Breadcrumb Navigation */}
            <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
              <Link to="/blog" className="hover:text-kibo-purple transition-colors">Blog</Link>
              <span>/</span>
              <span className="text-kibo-purple font-medium">{blogPost.title}</span>
            </nav>
            <div className="bg-purple-200 rounded-lg shadow-lg p-8">


              {/* Image Gallery Carousel */}
              {blogPost.images && blogPost.images.length > 0 && (
                <div className="mb-8">
                  <div className="relative h-[400px]">
                    <img
                      src={blogPost.images[currentImageIndex].src}
                      alt={blogPost.images[currentImageIndex].alt || `${blogPost.title} - Image ${currentImageIndex + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />

                    {/* Navigation Arrows */}
                    {blogPost.images.length > 1 && (
                      <>
                        <button
                          onClick={() => setCurrentImageIndex(prev => prev === 0 ? blogPost.images.length - 1 : prev - 1)}
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition-colors"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setCurrentImageIndex(prev => prev === blogPost.images.length - 1 ? 0 : prev + 1)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition-colors"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Image Dots */}
                  {blogPost.images.length > 1 && (
                    <div className="flex justify-center space-x-2 mt-4">
                      {blogPost.images.map((_, index) => (
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
                    __html: sanitizeRichContent(blogPost.content)
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

export default BlogPostDetail;
