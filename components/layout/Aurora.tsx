/**
 * Атмосферный слой.
 *
 * Чистый чёрный без источника света читается как выключенный экран.
 * Холодное пятно сверху задаёт направление света — от него стеклянные
 * панели получают внутренний блик, а карточки — понятную тень. Всё это
 * ниже 5% непрозрачности: слой должен работать, но не замечаться.
 */
export function Aurora() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Основной источник — сверху по центру, чуть смещён влево */}
      <div
        className="absolute left-1/2 top-0 h-[52vh] w-[120vw] max-w-[1600px] -translate-x-1/2 -translate-y-1/3 animate-aurora-drift opacity-[0.55] blur-[90px]"
        style={{
          background:
            'radial-gradient(closest-side, rgba(84,110,136,0.42), rgba(84,110,136,0.12) 55%, transparent 78%)',
        }}
      />
      {/* Тёплый противовес снизу справа: без него композиция «падает» влево */}
      <div
        className="absolute -bottom-1/4 right-[-10%] h-[46vh] w-[70vw] opacity-40 blur-[110px]"
        style={{
          background:
            'radial-gradient(closest-side, rgba(47,51,55,0.9), rgba(47,51,55,0.25) 60%, transparent 80%)',
        }}
      />
      {/* Виньетка возвращает края к чёрному, чтобы свечение не срезалось рамкой окна */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 80% at 50% 0%, transparent 40%, rgba(0,0,0,0.55) 100%)',
        }}
      />
    </div>
  );
}
