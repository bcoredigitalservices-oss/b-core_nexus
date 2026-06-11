import React, { useId } from 'react';

/* ─── Color tokens ──────────────────────────────────────────────────────────── */
const WHITE = 'var(--text-main)';

/* ─── Animation keyframes (injected once into <style>) ─────────────────────── */
const KEYFRAMES = `
  @keyframes nexus-draw {
    from { stroke-dashoffset: 1; }
    to   { stroke-dashoffset: 0; }
  }
  @keyframes nexus-fill-in {
    from { fill-opacity: 0; stroke-opacity: 1; }
    to   { fill-opacity: 1; stroke-opacity: 0; }
  }
  @keyframes nexus-text-rise {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0);   }
  }
  .nexus-logo-wrapper {
    position: relative;
    display: inline-block;
  }
  .nexus-logo-glow {
    position: absolute;
    top: 38%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 70%;
    height: 70%;
    background: radial-gradient(circle, rgba(0, 160, 223, 0.18) 0%, transparent 70%);
    filter: blur(24px);
    pointer-events: none;
    z-index: 0;
  }
`;

function pathStyle(color: string, drawDelay: number = 0) {
  const totalDraw = 1.5;
  const fillDelay = 1.4;
  const fillDuration = 0.5;
  return {
    fill:             color,
    fillOpacity:      0,
    stroke:           color,
    strokeWidth:      1.5,
    strokeLinecap:    'round' as const,
    strokeLinejoin:   'round' as const,
    strokeDasharray:  1,
    strokeDashoffset: 1,
    animation: [
      `nexus-draw ${totalDraw}s cubic-bezier(0.25, 1, 0.5, 1) ${drawDelay}s both`,
      `nexus-fill-in ${fillDuration}s ease-in-out ${fillDelay + drawDelay}s both`,
    ].join(', '),
  };
}

interface NexusLogoAnimatedProps {
  className?: string;
  style?: React.CSSProperties;
  width?: number;
}

export default function NexusLogoAnimated({
  className = '',
  style = {},
  width = 200,
}: NexusLogoAnimatedProps) {
  const uid = useId();

  // Left Stem & Top Loop: Dark Navy (#1A2B4C)
  // Bottom Loop: Bright Cyan (#00A0DF)

  const leftStemPath =
    "M55 25H55.25H131.75C132 24.9167 132.083 25 132 25.25V266.75V267H131.75H55.25C55 267.083 54.9167 267 55 266.75C55 265.833 55 265.25 55 265H54V264.75V244.25V244H55V243.75V238.25V238H54V236H55V235.75V227.25C54.9167 227 55 226.917 55.25 227H90.75H91V226H92V225.75V65.25V65H91.75H55.25C55 65.0833 54.9167 65 55 64.75V61.25V61H54V60.75V56.25V56H55V55.75V25.25V25Z";

  const topLoopPath =
    "M144 25H144.25H177.75H178V26H178.25H183.75H184V27H184.25H187.75H188V28H188.25H190.75H191V29H193V30H193.25H195.75H196V31H198V32H200V33C200.25 33 200.833 33 201.75 33H202V34H204V35H205V36H207V37H208V38H209V39H211V40H212V41H213V42H214V43H215V44H216V45H217V46H218V47H219V48H220V49H221V50H222V52H223V53H224V55H225V56H226V58H227V60H228V62H229V64H230V64.25C230 65.1667 230 65.75 230 66H231V66.25V68.75V69H232V69.25V71.75V72H233V72.25V74.75V75H234V75.25V79.75V80H235V80.25V90.75V91H236V91.25V93.75V94H235V94.25V103.75V104H234V104.25V108.75V109H233V109.25V112.75V113H232V113.25V115.75V116H231V116.25V118.75V119H230V121H229C229 121.25 229 121.833 229 122.75V123H228V125H227V126H226C226 126.25 226 126.833 226 127.75V128H225V130H224V131H223V133H222V134H221V135H220V137H219V138H218V139H217V140H216V141H215V142H214V143H213V144H212V145H211V146H209V147H208V148H207V149H205V150H204V151H202V152H200V153H198V154H196V155H194V156H192V157H191.75H189.25H189V158H188.75H186.25H186V159H185.75H181.25H181V160H180.75H176.25H176V161H175.75H145.25H145V160H144V159.75V120.25V120H144.25H166.75H167V119H167.25H176.75H177V118H177.25H179.75H180V117C180.25 117 180.833 117 181.75 117H182V116H184V115H185V114H187V113H188V112H189V111H190V109H191V108H192V106H193V104H194V102H195V101.75V97.25V97H196V96.75V88.25V88H195V87.75V84.25V84H194V83.75V81.25V81H193V79H192V78H191V76H190V75H189V74H188V73H187V72H186V71H185V70H184V69H182V68H180V67H179.75H177.25H177V66H176.75H172.25H172V65H171.75H144.25H144V64.75V25.25V25Z";

  const bottomLoopPath =
    "M221 134H221.25H223.75H224V135C224.25 135 224.833 135 225.75 135H226V136H228V137H229V138H230V139H231V140H232V141H234V142H235V143H236V144H237V146H238V147H239V148H240V149H241V150H242V152H243V153H244C244 153.25 244 153.833 244 154.75V155H245V157H246V158H247V160H248V162H249V162.25V164.75V165H250V167H251V167.25V169.75V170H252V170.25V172.75V173H253V173.25V176.75V177H254V177.25V181.75V182H255V183H254V184H255V184.25V202.75V203H254V204H255V205H254V206H255V207H254V207.25V211.75V212H253V212.25V215.75V216H252V216.25V218.75V219H251V219.25V221.75V222H250V224H249V226H248C248 226.25 248 226.833 248 227.75V228H247V230H246V231H245V233H244C244 233.25 244 233.833 244 234.75V235H243V237H242V238H241V239H240V240H239V241H238V242H238V243H237V244H236V245H234V247H233V248H232V249H231V250H230V251H228V252H227V253H226V254H224V255H223V256H222V257H220V258C219.75 258 219.167 258 218.25 258H218V259H216V260H215V261H213V262H212.75H210.25H210V263H208V264H207.75H204.25H204V265H202V266H201.75H197.25H197V267H196.75H191.25H191V268H189V267H188V268H187.75H145.25H145V267C144.75 267 144.167 267 143.25 267C143 267.083 142.917 267 143 266.75V234.25V234H144V233.75V174.25V174H143V173H144V172H144.25H182.75H183V173H185V174H184V174.25V181.75V182H185V182.25V212.75V213H184V214H185V216H184V216.25V218.75V219H185V220H184V220.25V222.75V223H185V223.25V225.75V226H185.25H189.75H190V225H190.25H193.75H194V224H194.25H196.75H197V223H199V222H200V221H200.25H202.75H203V220H204V218H206V216H207V215H208V214H209V213H210V211H211V209H212V207H213V206.75V203.25V203H214V202.75V197.25V197H215V196.75V193.25V193H214V192.75V187.25V187H213V186H214V185H213V183H212V182.75V180.25V180H211V179H210V177H209V176H208V174H207V173H206V172H205V171H204V170H203V169H202V168H200V167H199V166H198V165H196V164H195.75H193.25H193V163H192.75H190.25H190V162H189.75H182.25H182V161H180V160H181V159H181.25H185.75H186V158H186.25H188.75H189V157H189.25H191.75H192V156H194V155H196V154H198V153H200V152C200.25 152 200.833 152 201.75 152H202V151H204V150H205V149H207V148H208V147H209V146H211V145H212V144H213V143H214V142H215V141H216V140H217V139H218V138H219V137H220V135H221V134Z";

  return (
    <div className="nexus-logo-wrapper">
      <style>{KEYFRAMES}</style>
      <div className="nexus-logo-glow" />

      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 290 360"
        width={width}
        height="auto"
        role="img"
        aria-label="B-Core Nexus logo"
        className={className}
        style={{ display: 'block', position: 'relative', zIndex: 1, ...style }}
      >
        <title>B-Core Nexus</title>

        {/* ── Logo Glyphs ──────────────────────────────────────────────────── */}
        <g id={`${uid}-glyphs`}>
          {/* 1. Left Stem - Dark Navy (#1A2B4C) */}
          <path
            d={leftStemPath}
            pathLength="1"
            style={pathStyle('#1A2B4C', 0)}
          />

          {/* 2. Mirrored "C" (Top Loop) - Dark Navy (#1A2B4C) */}
          <path
            d={topLoopPath}
            pathLength="1"
            style={pathStyle('#1A2B4C', 0.15)}
          />

          {/* 3. Regular "D" (Bottom Loop) - Bright Cyan (#00A0DF) */}
          <path
            d={bottomLoopPath}
            pathLength="1"
            style={pathStyle('#00A0DF', 0.3)}
          />
        </g>

        {/* ── Text wordmark and subtitle ───────────────────────────────────── */}
        <g
          style={{
            animation: 'nexus-text-rise 0.75s cubic-bezier(0.25, 1, 0.5, 1) 1.8s both',
          }}
        >
          {/* Primary Wordmark */}
          <text
            x="145"
            y="305"
            textAnchor="middle"
            fontFamily="'Outfit', 'Inter', -apple-system, sans-serif"
            fontWeight="800"
            fontSize="23"
            letterSpacing="5.5"
            fill={WHITE}
            style={{ textShadow: '0 2px 10px rgba(0,0,0,0.6)' }}
          >
            B-CORE NEXUS
          </text>

          {/* Subtitle */}
          <text
            x="145"
            y="336"
            textAnchor="middle"
            fontFamily="'Outfit', 'Inter', -apple-system, sans-serif"
            fontWeight="800"
            fontSize="15"
            letterSpacing="2.5"
            fill="var(--accent-primary)"
            opacity="1"
          >
            by B-Core Digital
          </text>

          {/* Decorative Divider Line */}
          <line
            x1="75"
            y1="316"
            x2="215"
            y2="316"
            stroke="#00A0DF"
            strokeWidth="0.75"
            opacity="0.3"
          />
        </g>
      </svg>
    </div>
  );
}
