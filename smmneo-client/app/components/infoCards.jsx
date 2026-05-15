const cards = [
  {
    title: "Basics of SMM panels",
    description:
      "SMM panels provide growth services for social media accounts, helping businesses and creators gain more followers, likes, and engagement.",
  },
  {
    title: "What is an SMM Panel?",
    description:
      "An SMM panel is a service that helps clients purchase traffic for Instagram, Facebook, Twitter, TikTok, Youtube, and more through a single dashboard.",
  },
  {
    title: "Cost-effective Services",
    description:
      "Our services are designed for budget-conscious brands, offering fast delivery and real growth without hidden fees.",
  },
];

const InfoCards = () => {
  return (
    <section className="py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {cards.map((card) => (
            <article key={card.title} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-xl">
              <h3 className="text-xl font-semibold text-slate-900">{card.title}</h3>
              <p className="mt-4 text-slate-600 leading-7">{card.description}</p>
              <button className="mt-6 inline-flex items-center rounded-[3px] bg-violet-600 px-[3px] py-[3px] md:px-5 md:py-2.5 text-sm font-semibold text-white hover:bg-violet-500">
                Sign Up Now
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default InfoCards;
