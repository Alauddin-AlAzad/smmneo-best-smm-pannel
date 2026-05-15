const About = () => {
  return (
    <section className="py-12 sm:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-violet-600">Why SMMGen</p>
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Why SMMGen is the Best SMM Panel
            </h2>
            <p className="mt-6 text-slate-600 leading-8">
              SMMGen is not only an SMM panel, it’s your ally on the road to dominating social media.
              We deliver quality, affordability, and reliable customer service so your accounts grow fast.
            </p>
            <p className="mt-4 text-slate-600 leading-8">
              Our platform is designed for long-term growth with real results, easy navigation, and
              friendly support for every user.
            </p>
            <a
              href="#"
              className="inline-flex mt-8 rounded-full bg-violet-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200/40 transition hover:bg-violet-500"
            >
              About SMMGen
            </a>
          </div>
          <div className="relative rounded-[2rem] bg-violet-600/5 p-6 sm:p-8">
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-violet-500/15 to-transparent" />
            <div className="relative grid gap-6">
              <div className="rounded-3xl bg-white p-5 shadow-xl">
                <div className="text-sm uppercase tracking-[0.2em] text-violet-600">Best SMM Award</div>
                <div className="mt-4 text-2xl font-semibold text-slate-900">Trusted by thousands</div>
                <p className="mt-3 text-slate-600">Fast, affordable, and secure marketing services for every business.</p>
              </div>
              <div className="rounded-3xl bg-white p-5 shadow-xl">
                <div className="text-sm uppercase tracking-[0.2em] text-violet-600">24/7 Support</div>
                <div className="mt-4 text-2xl font-semibold text-slate-900">Free access</div>
                <p className="mt-3 text-slate-600">Our team is always available to help with technical and sales support.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
