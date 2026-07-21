const quotes = [
  {
    quote:
      "It pointed out that I was repeatedly missing 'Agile' in my tech stack list, even though I did it daily. Added it, and started getting interviews.",
    name: "Sarah Jenkins",
    role: "Frontend Developer",
  },
  {
    quote:
      "The cold email generator alone is worth it. It writes exactly like I would if I wasn't exhausted from applying to 50 jobs a day.",
    name: "Marcus Li",
    role: "Product Manager",
  },
  {
    quote:
      "Joblyser doesn't try to rewrite my entire resume into some corporate jargon. It just tells me the brutally honest gap. Exactly what I needed.",
    name: "Elena Rodriguez",
    role: "UX Designer",
  },
];

export default function Testimonials() {
  return (
    <section className="px-6 py-24 lg:py-32 border-t border-zinc-900">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-16 lg:gap-12">
          {quotes.map((item, i) => (
            <div key={i} className="flex flex-col">
              <div className="font-heading text-7xl text-amber-400 leading-none h-12 mb-6">
                &ldquo;
              </div>
              <p className="text-lg text-zinc-300 leading-relaxed mb-8 flex-grow">
                {item.quote}
              </p>
              <div>
                <div className="text-white font-medium mb-1">{item.name}</div>
                <div className="text-sm text-zinc-500 font-mono uppercase tracking-wide">
                  {item.role}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
