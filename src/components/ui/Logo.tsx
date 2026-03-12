import { motion, useReducedMotion } from 'motion/react';

interface LogoProps {
  size?: number;
  animate?: boolean;
  className?: string;
}

const paths = [
  // >_ prompt chevron
  { d: 'M47 36L53 42L47 48', strokeLinecap: 'butt' as const, strokeLinejoin: 'miter' as const },
  // >_ underscore (converted from line)
  { d: 'M58 48L68 48', strokeLinecap: 'butt' as const, strokeLinejoin: 'miter' as const },
  // cup body
  { d: 'M38 56H78V86L72 92H44L38 86V56Z', strokeLinejoin: 'miter' as const },
  // cup handle
  { d: 'M78 66H85L90 71V77L85 82H78', strokeLinejoin: 'miter' as const },
  // </> left bracket
  { d: 'M50 67L46 73L50 79', strokeLinecap: 'butt' as const, strokeLinejoin: 'miter' as const },
  // </> slash (converted from line)
  { d: 'M61 65L55 81', strokeLinecap: 'butt' as const, strokeLinejoin: 'miter' as const },
  // </> right bracket
  { d: 'M66 67L70 73L66 79', strokeLinecap: 'butt' as const, strokeLinejoin: 'miter' as const },
];

function Logo({ size = 48, animate = false, className = '' }: LogoProps) {
  const shouldReduceMotion = useReducedMotion();
  const shouldAnimate = animate && !shouldReduceMotion;

  return (
    <svg
      width={size}
      height={size}
      viewBox="33 31 62 66"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="icantcode.today logo"
      className={className || undefined}
      {...(shouldAnimate ? { 'data-animated': 'true' } : {})}
    >
      {paths.map((path, i) => {
        const pathProps = {
          d: path.d,
          stroke: 'var(--logo)',
          strokeWidth: 3,
          fill: 'none',
          ...(path.strokeLinecap ? { strokeLinecap: path.strokeLinecap } : {}),
          ...(path.strokeLinejoin ? { strokeLinejoin: path.strokeLinejoin } : {}),
        };

        if (shouldAnimate) {
          return (
            <motion.path
              key={i}
              {...pathProps}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                duration: 0.4,
                delay: i * 0.1,
                ease: 'easeOut',
              }}
            />
          );
        }

        return <path key={i} {...pathProps} />;
      })}
    </svg>
  );
}

export default Logo;
