'use client';

interface DesvioMediaChartProps {
  percentualDesvio: number;
}

export default function DesvioMediaChart({ percentualDesvio }: DesvioMediaChartProps) {
  // Normalizar o percentual para exibição (limitar entre -100% e 100% visualmente)
  const percentualNormalizado = Math.max(-100, Math.min(100, percentualDesvio));
  const percentualAbsoluto = Math.abs(percentualNormalizado);
  const isPositivo = percentualDesvio >= 0;

  // Para a barra, vamos mostrar a partir do centro (50%)
  // Se positivo, vai da esquerda até 50% + percentual/2
  // Se negativo, vai de 50% - percentual/2 até 50%
  const barraWidth = (percentualAbsoluto / 100) * 50; // Máximo 50% de cada lado
  const barraLeft = isPositivo ? 50 : (50 - barraWidth);
  const barraRight = isPositivo ? (50 + barraWidth) : 50;

  return (
    <div className="w-full mt-4">
      <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
        {/* Barra de desvio */}
        <div
          className={`absolute top-0 h-full transition-all duration-500 ${
            isPositivo ? 'bg-green-600' : 'bg-red-600'
          }`}
          style={{
            left: `${barraLeft}%`,
            width: `${barraWidth}%`,
            maxWidth: '50%'
          }}
        />
        {/* Linha de referência no centro (0%) */}
        <div className="absolute top-0 left-1/2 w-0.5 h-full bg-gray-400 opacity-50 transform -translate-x-1/2"></div>
        {/* Indicador do percentual acima da barra */}
        <div className={`absolute top-full mt-1 left-1/2 transform -translate-x-1/2 text-xs font-semibold ${
          isPositivo ? 'text-green-600' : 'text-red-600'
        }`}>
          {isPositivo ? '+' : ''}{percentualNormalizado.toFixed(1)}%
        </div>
      </div>
    </div>
  );
}

