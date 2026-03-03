import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import apiService, { BlogPost } from '../../services/apiService';

const Blog = () => {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBlogPosts = async () => {
      try {
        const posts = await apiService.getAllBlogPosts({ limit: 1000 });
        // Only show published posts on the public blog page
        const publishedPosts = posts.filter(post => post.status === 'published');
        setBlogPosts(publishedPosts);
      } catch (error) {
        console.error('Error fetching blog posts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlogPosts();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-orange-50">
      <Header />
      <main className="flex-grow">
        {/* --- Blog Banner Section --- */}
        <div className="bg-gradient-to-r from-kibo-purple to-kibo-orange overflow-hidden">
          <div className="container mx-auto px-4 flex items-center h-64 overflow-hidden">
            <div className="w-full text-center">
              <h2 className="text-3xl font-bold text-white mb-4">Blog</h2>
              <p className="text-white/90">
                Stay updated with the latest news, insights, and stories from KIBO
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
          ) : blogPosts.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No blog posts available</h3>
              <p className="text-gray-500">Check back later for new content!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {blogPosts.map((post) => (
                <Link 
                  key={post.id} 
                  to={`/blog/${post.id}`}
                  className="block"
                >
                  <div className="bg-purple-200 rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow cursor-pointer h-full flex flex-col">
                    {/* Post Image */}
                    <div className="relative h-48 flex-shrink-0">
                      {post.images && post.images.length > 0 ? (
                        <>
                          <img
                            src={post.images[0].src}
                            alt={post.title}
                            className="w-full h-full object-cover"
                          />
                          {/* Dark overlay */}
                          <div className="absolute inset-0 bg-black bg-opacity-75"></div>
                          {/* Title overlay */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <h3 className="text-xl font-bold text-kibo-orange text-center px-4 drop-shadow-lg">{post.title}</h3>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-kibo-purple to-kibo-orange flex items-center justify-center">
                          <h3 className="text-xl font-bold text-white text-center px-4">{post.title}</h3>
                        </div>
                      )}
                      {/* Category Tag */}
                      <div className="absolute top-2 right-2">
                        <div className="bg-kibo-orange text-white px-2 py-1 rounded text-xs font-semibold">
                          Blog
                        </div>
                      </div>
                    </div>

                    {/* Post Content */}
                    <div className="p-4 flex-grow">
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {post.excerpt}
                      </p>
                    </div>
                    
                    {/* Date Information */}
                    <div className="px-4 pb-4 flex-shrink-0">
                      <div className="flex justify-between items-center text-gray-500 text-sm border-t border-gray-200 pt-3">
                        <span title={`Published on ${new Date(post.publishDate).toLocaleDateString('en-US')}`}>Published: {new Date(post.publishDate).toLocaleDateString('en-US')}</span>
                        <span title={`Last updated on ${new Date(post.updatedAt).toLocaleDateString('en-US')}`}>Updated: {new Date(post.updatedAt).toLocaleDateString('en-US')}</span>
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

export default Blog;
