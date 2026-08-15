// src/pages/BlogDetailPage.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { resolveImage } from '../utils/imageResolver';

function blogTag(type) {
    return type === 'Lookbook' ? 'Bộ sưu tập' : 'Cảm hứng hoa';
}

export default function BlogDetailPage() {
    const { slug } = useParams();
    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        import("../api/client").then(({ default: apiClient }) => {
            apiClient.get(`/blog/${slug}`)
                .then(res => {
                    setBlog(res.data);
                    setError(null);
                })
                .catch(err => {
                    setError('Không tìm thấy bài viết.');
                })
                .finally(() => setLoading(false));
        });
    }, [slug]);

    if (loading) return <div className="min-h-screen pt-32 pb-20 px-4 text-center text-stone-400">Đang tải...</div>;
    if (error || !blog) return <div className="min-h-screen pt-32 pb-20 px-4 text-center text-stone-500">{error}</div>;

    return (
        <div style={{ backgroundColor: '#fffdfb' }} className="min-h-screen pb-24 pt-12">
            <div className="max-w-3xl mx-auto px-4">
                {/* Back button */}
                <Link to="/blog" className="inline-flex items-center gap-2 text-[10px] font-bold text-stone-400 hover:text-pink-500 mb-12 transition-colors uppercase tracking-[0.2em]">
                    <ChevronLeft size={12} /> Quay lại Tin tức
                </Link>

                {/* Header */}
                <div className="text-center mb-12">
                    <span className="inline-block text-[9px] font-bold uppercase tracking-[0.3em] px-4 py-1.5 bg-stone-50 text-stone-400 rounded-full mb-6 border border-stone-100">
                        {blogTag(blog.type)}
                    </span>
                    <h1 className="text-2xl md:text-3xl font-bold mb-6 text-stone-800 leading-tight" style={{ fontFamily: "serif" }}>
                        {blog.title}
                    </h1>
                </div>

                {/* Cover Image */}
                {blog.coverImageUrl && (
                    <div className="w-full rounded-2xl overflow-hidden mb-16 shadow-sm border border-stone-50">
                        <img
                            src={resolveImage(blog.coverImageUrl)}
                            alt={blog.title}
                            className="w-full h-auto object-cover max-h-[550px]"
                        />
                    </div>
                )}

                {/* Content */}
                <div
                    className="prose prose-stone max-w-none 
                    prose-p:text-stone-600 prose-p:leading-[1.8] prose-p:text-[15px]
                    prose-headings:text-stone-800 prose-headings:font-serif prose-h3:text-lg prose-h3:mt-10
                    prose-strong:text-stone-700
                    prose-li:text-stone-600 prose-li:text-[15px]"
                    dangerouslySetInnerHTML={{ __html: blog.content }}
                />
            </div>
        </div>
    );
}
