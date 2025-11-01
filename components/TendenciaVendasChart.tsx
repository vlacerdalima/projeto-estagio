'use client';

interface TendenciaVendasChartProps {
  dadosMensais: Array<{
    mes: number;
    ano: number;
    vendas: number;
  }>;
}

export default function TendenciaVendasChart({ dadosMensais }: TendenciaVendasChartProps) {
  if (!dadosMensais || dadosMensais.length === 0) {
    return (
      <div className="w-full h-12 flex items-center justify-center text-xs text-zinc-400">
        Sem dados disponíveis
      </div>
    );
  }

  // Normalizar os dados para o gráfico (altura máxima de 40px)
  const maxVendas = Math.max(...dadosMensais.map(d => d.vendas));
  const minVendas = Math.min(...dadosMensais.map(d => d.vendas));
  const range = maxVendas - minVendas || 1; // Evitar divisão por zero

  // Gerar pontos do sparkline
  const width = 120;
  const height = 40;
  const padding = 4;
  const plotWidth = width - padding * 2;
  const plotHeight = height - padding * 2;

  const points = dadosMensais.map((dado, index) => {
    const x = padding + (index / (dadosMensais.length - 1 || 1)) * plotWidth;
    const normalized = (dado.vendas - minVendas) / range;
    const y = padding + plotHeight - (normalized * plotHeight);
    return { x, y };
  });

  // Gerar path SVG
  const pathData = points.map((point, index) => {
    return `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`;
  }).join(' ');

  // Adicionar área abaixo da linha para melhor visualização
  const areaPath = `${pathData} L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`;

  return (
    <div className="w-full h-12 flex items-center">
      <svg width={width} height={height} className="overflow-visible">
        {/* Área abaixo da linha (gradiente suave) */}
        <defs>
          <linearGradient id="tendenciaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fa8072" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#fa8072" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <path
          d={areaPath}
          fill="url(#tendenciaGradient)"
        />
        {/* Linha do sparkline */}
        <path
          d={pathData}
          fill="none"
          stroke="#fa8072"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Pontos nos extremos */}
        {points.length > 0 && (
          <>
            <circle
              cx={points[0].x}
              cy={points[0].y}
              r="2"
              fill="#fa8072"
            />
            <circle
              cx={points[points.length - 1].x}
              cy={points[points.length - 1].y}
              r="2"
              fill="#fa8072"
            />
          </>
        )}
      </svg>
    </div>
  );
}

