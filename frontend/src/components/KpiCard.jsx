export default function KpiCard({ title, value, subtitle, color = "#635BFF" }) {
  return (
    <div
      className="relative overflow-hidden bg-white dark:bg-[#0F2240] border border-[#E3E8EF] dark:border-[#1E3A5F] rounded-xl shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group"
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl"
        style={{ background: `linear-gradient(90deg, ${color} 0%, ${color}66 100%)` }}
      />

      <div className="pt-4 pb-4 px-4">
        {/* Label */}
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.07em] text-[#697386] dark:text-[#7B93AE] mb-2">
          {title}
        </p>

        {/* Value */}
        <p className="text-3xl md:text-[1.75rem] font-bold tracking-tight text-[#1A1F36] dark:text-[#C9D7E8] mb-2 leading-tight">
          {value}
        </p>

        {/* Subtitle with colour dot */}
        <div className="flex items-center gap-1.5">
          <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: color }}
          />
          <span className="text-[0.8125rem] text-[#697386] dark:text-[#7B93AE] leading-tight">
            {subtitle}
          </span>
        </div>
      </div>
    </div>
  );
}
