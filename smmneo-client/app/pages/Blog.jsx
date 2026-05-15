const blogs = [
  {
    id: 1,
    title: "The 80–20 Rule in Social Media Marketing",
    description:
      "Discover how focusing on the right content can dramatically improve your social media engagement and audience growth.",
    image:
      "https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 2,
    title: "How to Make Money Online with Content",
    description:
      "Learn how creators are monetizing social platforms and building sustainable online businesses.",
    image:
      "https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 3,
    title: "TikTok SEO: Rank Videos Faster",
    description:
      "Optimize your TikTok videos with trending keywords and boost discoverability organically.",
    image:
      "https://images.unsplash.com/photo-1611605698335-8b1569810432?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 4,
    title: "How Social Media Algorithms Work",
    description:
      "Understand how platforms prioritize content and how you can increase your reach.",
    image:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 5,
    title: "Micro vs Nano Influencers",
    description:
      "Find out which type of influencer marketing delivers the best ROI for brands in 2026.",
    image:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 6,
    title: "Why Social Proof Matters",
    description:
      "Increase conversions and customer trust by leveraging reviews, followers, and engagement.",
    image:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop",
  },
];

const Blog = () => {
  return (
    <div className="min-h-screen bg-[#f5f5f5] text-slate-900">

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#e9ddff] via-[#f7eadf] to-[#e9ddff] py-20">
        {/* Grid Shape Left */}
        <div className="absolute left-5 top-10 grid grid-cols-3 gap-2 opacity-40">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className="h-8 w-8 border border-violet-300"
            ></div>
          ))}
        </div>

        {/* Grid Shape Right */}
        <div className="absolute right-5 top-10 grid grid-cols-3 gap-2 opacity-40">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className="h-8 w-8 border border-violet-300"
            ></div>
          ))}
        </div>

        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="font-[Poppins] text-4xl font-bold text-slate-900 md:text-5xl">
            Our Blogs
          </h1>

          <p className="mx-auto mt-5 max-w-3xl font-[Poppins] text-[16px] leading-8 text-slate-600">
            Welcome to SMMNeo’s blog section. Discover the latest social media
            marketing trends, growth strategies, SMM panel updates, and expert
            insights to help your brand grow faster online.
          </p>
        </div>
      </section>

      {/* Blog Cards */}
      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {blogs.map((blog) => (
            <div
              key={blog.id}
              className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
            >
              {/* Image */}
              <div className="h-56 overflow-hidden">
                <img
                  src={blog.image}
                  alt={blog.title}
                  className="h-full w-full object-cover transition duration-500 hover:scale-105"
                />
              </div>

              {/* Content */}
              <div className="p-6">
                <h2 className="font-[Poppins] text-[24px] font-bold leading-snug text-slate-900">
                  {blog.title}
                </h2>

                <p className="mt-3 font-[Poppins] text-[16px] leading-7 text-slate-600">
                  {blog.description}
                </p>

                <button className="mt-5 rounded-xl bg-violet-600 px-5 py-2.5 font-[Poppins] text-[15px] font-semibold text-white transition hover:bg-violet-500">
                  Read More
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Blog;