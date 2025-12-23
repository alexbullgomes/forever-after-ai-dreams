import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// Neutral scale
				neutral: {
					50: 'hsl(var(--neutral-50))',
					100: 'hsl(var(--neutral-100))',
					200: 'hsl(var(--neutral-200))',
					300: 'hsl(var(--neutral-300))',
					400: 'hsl(var(--neutral-400))',
					500: 'hsl(var(--neutral-500))',
					600: 'hsl(var(--neutral-600))',
					700: 'hsl(var(--neutral-700))',
					800: 'hsl(var(--neutral-800))',
					900: 'hsl(var(--neutral-900))',
					950: 'hsl(var(--neutral-950))',
				},
				// Status colors
				success: {
					DEFAULT: 'hsl(var(--success))',
					light: 'hsl(var(--success-light))',
					text: 'hsl(var(--success-text))',
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					light: 'hsl(var(--warning-light))',
					text: 'hsl(var(--warning-text))',
				},
				error: {
					DEFAULT: 'hsl(var(--error))',
					light: 'hsl(var(--error-light))',
					text: 'hsl(var(--error-text))',
				},
				info: {
					DEFAULT: 'hsl(var(--info))',
					light: 'hsl(var(--info-light))',
					text: 'hsl(var(--info-text))',
				},
				// Surface levels
				surface: {
					0: 'hsl(var(--surface-0))',
					1: 'hsl(var(--surface-1))',
					2: 'hsl(var(--surface-2))',
					3: 'hsl(var(--surface-3))',
				},
				// Brand colors
				brand: {
					// Primary gradient colors
					'primary-from': 'hsl(var(--brand-primary-from))',
					'primary-to': 'hsl(var(--brand-primary-to))',
					'primary-hover-from': 'hsl(var(--brand-primary-hover-from))',
					'primary-hover-to': 'hsl(var(--brand-primary-hover-to))',
					
					// Icon backgrounds
					'icon-bg-primary': 'hsl(var(--brand-icon-bg-primary))',
					'icon-bg-secondary': 'hsl(var(--brand-icon-bg-secondary))',
					'icon-bg-accent': 'hsl(var(--brand-icon-bg-accent))',
					
					// Text accents
					'text-accent': 'hsl(var(--brand-text-accent))',
					'badge-text': 'hsl(var(--brand-badge-text))',
					'stats-text': 'hsl(var(--brand-stats-text))',
					
					// Backgrounds
					'badge-bg': 'hsl(var(--brand-badge-bg))',
					
					// Decorative elements
					'feature-dot': 'hsl(var(--brand-feature-dot))',
				},
				hero: {
					'overlay': 'hsl(var(--hero-overlay-color))',
					'badge-bg': 'hsl(var(--hero-badge-bg-color))',
					'badge-icon': 'hsl(var(--hero-badge-icon))',
					'gradient-from': 'hsl(var(--hero-gradient-from))',
					'gradient-via': 'hsl(var(--hero-gradient-via))',
					'gradient-to': 'hsl(var(--hero-gradient-to))',
					'text-primary': 'hsl(var(--hero-text-primary))',
					'text-muted': 'hsl(var(--hero-text-muted))',
					'trust-text': 'hsl(var(--hero-trust-text))',
					'glow-1-from': 'hsl(var(--hero-glow-1-from))',
					'glow-1-to': 'hsl(var(--hero-glow-1-to))',
					'glow-2-from': 'hsl(var(--hero-glow-2-from))',
					'glow-2-to': 'hsl(var(--hero-glow-2-to))',
				},
				service: {
					'icon-gradient-from': 'hsl(var(--service-icon-gradient-from))',
					'icon-gradient-to': 'hsl(var(--service-icon-gradient-to))',
				},
				cta: {
					'icon': 'hsl(var(--cta-icon))',
				}
			},
			backgroundImage: {
				'brand-gradient': 'linear-gradient(to right, hsl(var(--brand-primary-from)), hsl(var(--brand-primary-to)))',
				'brand-gradient-hover': 'linear-gradient(to right, hsl(var(--brand-primary-hover-from)), hsl(var(--brand-primary-hover-to)))',
				'service-icon-gradient': 'linear-gradient(135deg, hsl(var(--service-icon-gradient-from)), hsl(var(--service-icon-gradient-to)))',
				'contact-bg-gradient': 'linear-gradient(to bottom right, hsl(var(--contact-bg-gradient-from)), hsl(var(--contact-bg-gradient-to)))',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			borderColor: {
				subtle: 'hsl(var(--border-subtle))',
				strong: 'hsl(var(--border-strong))',
				brand: 'hsl(var(--border-brand))',
			},
			ringColor: {
				brand: 'hsl(var(--ring-brand))',
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'pulse-subtle': {
					'0%, 100%': { transform: 'scale(1)' },
					'50%': { transform: 'scale(1.03)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'pulse-subtle': 'pulse-subtle 3s ease-in-out infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
