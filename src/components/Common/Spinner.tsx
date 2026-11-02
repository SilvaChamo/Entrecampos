/**
 * Indicador de "a processar" único do site: dois arcos que giram em sentidos opostos e velocidades diferentes,
 * com um ponto central que pulsa. Usa a cor do texto (`currentColor`), por isso serve em fundos claros e em botões.
 * Tamanho em px (`size`); o resto vai em `className` (margens, cor...).
 */
export default function Spinner({ size = 32, className = '', label = 'A processar…' }: { size?: number; className?: string; label?: string }) {
  return (
    <span role="status" aria-label={label} className={`ec-spinner ${className.includes('mx-auto') ? 'block' : 'inline-block'} align-middle ${className}`} style={{ width: size, height: size }}>
      <span className="ec-spinner-outer" />
      <span className="ec-spinner-inner" />
      <span className="ec-spinner-dot" />
    </span>
  );
}
