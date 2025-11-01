'use client';

interface TendenciaVendasChartProps {
  dadosMensais: Array<{
    mes: number;
    ano: number;
    vendas: number;
  }>;
}

const mesesAbreviados = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export default function TendenciaVendasChart({ dadosMensais }: TendenciaVendasChartProps) {
  if (!dadosMensais || dadosMensais.length === 0) {
    return (
      <div className="w-full h-40 flex items-center justify-center text-xs text-zinc-400">
        Sem dados disponíveis
      </div>
    );
  }

  // Dimensões maiores do gráfico
  const chartWidth = 400; // Largura fixa em pixels
  const chartHeight = 140;
  const paddingLeft = 45; // Espaço para labels Y
  const paddingRight = 15;
  const paddingTop = 10;
  const paddingBottom = 25; // Espaço para labels X
  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;

  // Normalizar os dados para o gráfico
  const maxVendas = Math.max(...dadosMensais.map(d => d.vendas));
  const minVendas = Math.min(...dadosMensais.map(d => d.vendas));
  const range = maxVendas - minVendas || 1; // Evitar divisão por zero

  // Calcular valores para o eixo Y (mínimo, máximo e alguns intermediários)
  const numYTicks = 4;
  const yTicks: number[] = [];
  for (let i = 0; i <= numYTicks; i++) {
    const value = minVendas + (range * i / numYTicks);
    yTicks.push(Math.round(value));
  }

  // Gerar pontos do gráfico
  const points = dadosMensais.map((dado, index) => {
    const divisor = dadosMensais.length > 1 ? dadosMensais.length - 1 : 1;
    const x = paddingLeft + (index / divisor) * plotWidth;
    const normalized = (dado.vendas - minVendas) / range;
    const y = paddingTop + plotHeight - (normalized * plotHeight);
    return { x, y, mes: dado.mes, vendas: dado.vendas };
  });

  // Gerar path SVG
  const pathData = points.map((point, index) => {
    return `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`;
  }).join(' ');

  // Adicionar área abaixo da linha
  const areaPath = `${pathData} L ${points[points.length - 1].x} ${chartHeight - paddingBottom} L ${paddingLeft} ${chartHeight - paddingBottom} Z`;

  return (
    <div className="w-full overflow-x-auto" style={{ height: `${chartHeight}px` }}>
      <svg width={chartWidth} height={chartHeight} className="overflow-visible" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
        <defs>
          <linearGradient id="tendenciaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fa8072" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#fa8072" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        
        {/* Grid linhas horizontais */}
        {yTicks.map((value, index) => {
          const y = paddingTop + plotHeight - ((value - minVendas) / range) * plotHeight;
          return (
            <g key={index}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={paddingLeft + plotWidth}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
              {/* Label do eixo Y */}
              <text
                x={paddingLeft - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill="#6b7280"
                className="font-medium"
              >
                {value.toLocaleString()}
              </text>
            </g>
          );
        })}
        
        {/* Área abaixo da linha */}
        <path
          d={areaPath}
          fill="url(#tendenciaGradient)"
        />
        
        {/* Linha do gráfico */}
        <path
          d={pathData}
          fill="none"
          stroke="#fa8072"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Pontos nos dados */}
        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="3"
            fill="#fa8072"
            stroke="white"
            strokeWidth="1.5"
          />
        ))}
        
        {/* Labels dos meses no eixo X */}
        {points.map((point, index) => {
          // Mostrar apenas alguns labels para não ficar muito cheio
          const shouldShowLabel = index % Math.ceil(points.length / 6) === 0 || index === points.length - 1;
          if (!shouldShowLabel) return null;
          
          return (
            <text
              key={index}
              x={point.x}
              y={chartHeight - paddingBottom + 18}
              textAnchor="middle"
              fontSize="10"
              fill="#6b7280"
              className="font-medium"
            >
              {mesesAbreviados[point.mes - 1]}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

