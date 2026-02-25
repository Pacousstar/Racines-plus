import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

export default function Icon() {
    return new ImageResponse(
        (
            <div
                style={{
                    background: '#FF6600',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '128px', // Slightly rounded square for a beautiful app icon
                    overflow: 'hidden',
                    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.1)'
                }}
            >
                <div style={{
                    fontSize: 280,
                    fontWeight: 900,
                    color: 'white',
                    letterSpacing: '-0.05em',
                    marginTop: '-20px',
                    fontFamily: 'sans-serif'
                }}>
                    R+
                </div>
            </div>
        ),
        { ...size }
    )
}
