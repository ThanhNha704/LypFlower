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
    return type === "Lookbook" ? "BỘ SƯU TẬP HOA" : "CẢM HỨNG HOA";
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

            {/* Banner */}
            <div className="relative h-64 md:h-80 w-full overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-black">
                    <img
                        src="https://images.unsplash.com/photo-1490750967868-88aa4486c946"
                        alt="Blog Hoa"
                        className="w-full h-full object-cover opacity-50"
                    />
                </div>

                <div className="relative z-10 text-center text-white px-4">
                    <p className="text-xs font-bold uppercase tracking-widest mb-3 text-amber-400">
                        Blog Hoa
                    </p>

                    <h1
                        className="text-4xl md:text-5xl font-bold"
                        style={{ fontFamily: "serif" }}
                    >
                        Tin Tức & Cảm Hứng Hoa
                    </h1>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-12">
                {loading ? (
                    <div className="text-center py-20 dark:text-gray-400">Đang tải...</div>
                ) : blogs.length === 0 ? (
                    <div className="text-center py-20 text-gray-500 dark:text-gray-400">
                        Chưa có bài viết nào.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {blogs.map((post) => (
                            <Link
                                key={post.id}
                                to={`/blog/${post.slug}`}
                                className="group block"
                            >
                                <div className="rounded-2xl overflow-hidden aspect-video bg-gray-100 dark:bg-slate-800 mb-4 relative">
                                    <img
                                        src={resolveImage(post.coverImageUrl)}
                                        alt={post.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />

                                    <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs text-white bg-black/60">
                                        {blogTag(post.type)}
                                    </div>
                                </div>

                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                    {formatBlogDate(post.createdAt)}
                                </p>

                                <h3 className="text-lg font-bold mb-2 text-gray-800 dark:text-gray-200 group-hover:text-amber-600 dark:group-hover:text-amber-400">
                                    {post.title}
                                </h3>

                                <p className="text-sm text-gray-600 dark:text-gray-400">{post.excerpt}</p>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}