import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { resolveImage } from "../utils/imageResolver";

function formatBlogDate(createdAt) {
    const d = new Date(createdAt);
    return d.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "short",
    });
}

function blogTag(type) {
    if (type === 0) return "Kiến thức về hoa";
    if (type === 1) return "Ý nghĩa hoa";
    if (type === 2) return "Chăm sóc hoa";
    return "Tin tức";
}

export default function BlogPage() {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        import("../api/client").then(({ default: apiClient }) => {
            apiClient.get("/blog")
                .then(res => {
                    // API returns { Total, Page, PageSize, Items }
                    const posts = res.data.items ?? res.data ?? [];
                    setBlogs(posts.filter(p => p.isPublished !== false));
                })
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        });
    }, []);

    return (
        <div className="bg-[#faf7f2] dark:bg-[#121212] transition-colors min-h-screen pb-20">

            {/* Header */}
            <div className="pt-16 pb-12 text-center px-4">
                <h1
                    className="text-3xl md:text-4xl font-bold mb-4 text-stone-800 dark:text-stone-100 uppercase tracking-wide"
                    style={{ fontFamily: "serif" }}
                >
                    TIN TỨC & KIẾN THỨC VỀ HOA
                </h1>
                <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-lg">
                    Khám phá những câu chuyện thú vị về thế giới hoa
                </p>
            </div>

            <div className="max-w-7xl mx-auto px-4 pb-16">
                {loading ? (
                    <div className="text-center py-20 dark:text-gray-400">Đang tải...</div>
                ) : blogs.length === 0 ? (
                    <div className="text-center py-20 text-gray-500 dark:text-gray-400">
                        Chưa có bài viết nào.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {blogs.map((post) => (
                            <Link key={post.id} to={`/blog/${post.slug}`} className="group flex flex-col h-full bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100 dark:border-slate-700">
                                {/* Image */}
                                <div className="aspect-[4/3] overflow-hidden relative">
                                    <img 
                                        src={resolveImage(post.coverImageUrl)} 
                                        alt={post.title} 
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                    />
                                </div>
                                
                                {/* Content */}
                                <div className="p-6 flex flex-col flex-grow">
                                    {/* Category Tag */}
                                    <div className="mb-3">
                                        <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500">
                                            {blogTag(post.type)}
                                        </span>
                                    </div>
                                    
                                    {/* Title */}
                                    <h3 className="text-xl font-bold mb-3 text-stone-800 dark:text-stone-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-2">
                                        {post.title}
                                    </h3>
                                    
                                    {/* Excerpt */}
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 line-clamp-3 flex-grow">
                                        {post.excerpt}
                                    </p>
                                    
                                    {/* Read More Link */}
                                    <div className="mt-auto flex items-center text-sm font-semibold text-amber-600 dark:text-amber-500 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                                        Xem thêm
                                        <svg className="w-4 h-4 ml-1 transform transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}