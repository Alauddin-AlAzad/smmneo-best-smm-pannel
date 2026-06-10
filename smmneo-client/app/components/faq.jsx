const faqItems = [
  { question: "What is Social Media Marketing (SMM)?", answer: "SMM is a marketing strategy that uses social platforms to grow visibility, engagement, and conversions for businesses online." },
  { question: "Is it safe to use SMMSecure?", answer: "Yes. We use trusted service providers and manage delivery carefully to keep your accounts secure." },
  { question: "Can I use SMMSecure for multiple social media accounts?", answer: "Absolutely. Our platform supports multiple accounts across Instagram, Facebook, TikTok, Twitter, and more." },
  { question: "Can I get a refund if I don't see results?", answer: "We offer support and investigation for orders that do not perform as expected." },
];

const FAQ = () => {
  return (
    <section className="py-12 sm:py-16 bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.28em] text-violet-300">FAQs</p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-semibold">Frequently Asked Questions</h2>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {faqItems.map((item) => (
            <article key={item.question} className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl shadow-slate-950/20">
              <h3 className="text-lg font-semibold text-white">{item.question}</h3>
              <p className="mt-3 text-slate-300 leading-7">{item.answer}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
