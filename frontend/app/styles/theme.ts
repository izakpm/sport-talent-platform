export const theme = {
  colors: {
      // ✅ Base
      primary: '#1f6f8b',
      primaryHover: '#155e75',

      // ✅ Layout
      background: '#f8fafc',
      card: '#ffffff',

      // ✅ Overlay
      overlay: 'linear-gradient(to right, rgba(11,31,46,0.7), rgba(11,31,46,0.3))',

      // ✅ Inputs (match register page exactly)
      inputBackground: '#ffffff',
      border: '#d1d5db',

      // ✅ Text
      textPrimary: '#111827',
      textMuted: '#6b7280',
      white: '#ffffff',

      // ✅ Buttons / accents
      accent: '#e5e7eb',
      accentDark: '#1f6f8b',
    },


    typography: {
      heading: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#111827',
      },

    subheading: {
      fontSize: 16,
      fontWeight: 600,
      color: '#111827',
    },

    body: {
      fontSize: 14,
      color: '#374151',
    },

    muted: {
      fontSize: 13,
      color: '#6b7280',
    },
  },

  spacing: {
    cardPadding: 20,
    borderRadius: 16,
  },
};