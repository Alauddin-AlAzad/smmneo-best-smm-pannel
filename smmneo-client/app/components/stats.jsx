const stats = [
  { label: "Order Completed", value: "81,699,751" },
  { label: "Active Services", value: "9,275" },
  { label: "Active Users", value: "81,929" },
  { label: "SMM Panel Worldwide", value: "#1" },
];

const Stats = () => {
  return (
    <section className="py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => (
            <article
              key={item.label}
              className="rounded-3xl border border-slate-200 bg-gradient-to-br from-violet-600 to-fuchsia-600 p-6 text-white shadow-xl"
            >
              <div className="text-sm uppercase tracking-[0.24em] text-violet-100/80">
                {item.label}
              </div>
              <div className="mt-6 text-3xl sm:text-4xl font-semibold tracking-tight">
                {item.value}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;
