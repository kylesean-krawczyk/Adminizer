import React from 'react'
import { useTheme } from '../../hooks'
import { useVertical } from '../../contexts/VerticalContext'
import { Check, X, Info, AlertTriangle } from 'lucide-react'

const ThemePreview: React.FC = () => {
  const { colors } = useTheme()
  const { vertical } = useVertical()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: colors.text.primary }}>
          Theme Preview
        </h2>
        <p style={{ color: colors.text.secondary }}>
          Current vertical: <span className="font-semibold">{vertical.displayName}</span>
        </p>
      </div>

      {/* Color Palette */}
      <div>
        <h3 className="text-lg font-semibold mb-4" style={{ color: colors.text.primary }}>
          Color Palette
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Primary Color */}
          <div>
            <div
              className="h-20 rounded-lg shadow-sm mb-2"
              style={{ backgroundColor: colors.primary }}
            />
            <p className="text-sm font-medium" style={{ color: colors.text.primary }}>Primary</p>
            <p className="text-xs font-mono" style={{ color: colors.text.secondary }}>{colors.primary}</p>
          </div>

          {/* Secondary Color */}
          <div>
            <div
              className="h-20 rounded-lg shadow-sm mb-2"
              style={{ backgroundColor: colors.secondary }}
            />
            <p className="text-sm font-medium" style={{ color: colors.text.primary }}>Secondary</p>
            <p className="text-xs font-mono" style={{ color: colors.text.secondary }}>{colors.secondary}</p>
          </div>

          {/* Accent Color */}
          <div>
            <div
              className="h-20 rounded-lg shadow-sm mb-2"
              style={{ backgroundColor: colors.accent }}
            />
            <p className="text-sm font-medium" style={{ color: colors.text.primary }}>Accent</p>
            <p className="text-xs font-mono" style={{ color: colors.text.secondary }}>{colors.accent}</p>
          </div>

          {/* Background Color */}
          <div>
            <div
              className="h-20 rounded-lg shadow-sm mb-2 border"
              style={{ backgroundColor: colors.background, borderColor: colors.borders }}
            />
            <p className="text-sm font-medium" style={{ color: colors.text.primary }}>Background</p>
            <p className="text-xs font-mono" style={{ color: colors.text.secondary }}>{colors.background}</p>
          </div>
        </div>

        {/* Status Colors */}
        <div className="mt-6">
          <h4 className="text-md font-semibold mb-3" style={{ color: colors.text.primary }}>
            Status Colors
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div
                className="h-16 rounded-lg shadow-sm mb-2"
                style={{ backgroundColor: colors.status.success }}
              />
              <p className="text-sm font-medium" style={{ color: colors.text.primary }}>Success</p>
              <p className="text-xs font-mono" style={{ color: colors.text.secondary }}>{colors.status.success}</p>
            </div>

            <div>
              <div
                className="h-16 rounded-lg shadow-sm mb-2"
                style={{ backgroundColor: colors.status.warning }}
              />
              <p className="text-sm font-medium" style={{ color: colors.text.primary }}>Warning</p>
              <p className="text-xs font-mono" style={{ color: colors.text.secondary }}>{colors.status.warning}</p>
            </div>

            <div>
              <div
                className="h-16 rounded-lg shadow-sm mb-2"
                style={{ backgroundColor: colors.status.error }}
              />
              <p className="text-sm font-medium" style={{ color: colors.text.primary }}>Error</p>
              <p className="text-xs font-mono" style={{ color: colors.text.secondary }}>{colors.status.error}</p>
            </div>

            <div>
              <div
                className="h-16 rounded-lg shadow-sm mb-2"
                style={{ backgroundColor: colors.status.info }}
              />
              <p className="text-sm font-medium" style={{ color: colors.text.primary }}>Info</p>
              <p className="text-xs font-mono" style={{ color: colors.text.secondary }}>{colors.status.info}</p>
            </div>
          </div>
        </div>
      </div>

      {/* UI Components Preview */}
      <div>
        <h3 className="text-lg font-semibold mb-4" style={{ color: colors.text.primary }}>
          UI Components
        </h3>

        {/* Buttons */}
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2" style={{ color: colors.text.primary }}>Buttons</p>
            <div className="flex flex-wrap gap-3">
              <button
                className="px-4 py-2 rounded-lg text-white font-medium"
                style={{ backgroundColor: colors.primary }}
              >
                Primary Button
              </button>
              <button
                className="px-4 py-2 rounded-lg text-white font-medium"
                style={{ backgroundColor: colors.secondary }}
              >
                Secondary Button
              </button>
              <button
                className="px-4 py-2 rounded-lg border font-medium"
                style={{
                  borderColor: colors.borders,
                  color: colors.text.primary,
                  backgroundColor: colors.surface
                }}
              >
                Outline Button
              </button>
            </div>
          </div>

          {/* Cards */}
          <div>
            <p className="text-sm font-medium mb-2" style={{ color: colors.text.primary }}>Cards</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                className="p-4 rounded-lg shadow-sm"
                style={{ backgroundColor: colors.surface, borderColor: colors.borders }}
              >
                <h4 className="font-semibold mb-2" style={{ color: colors.text.primary }}>
                  Sample Card
                </h4>
                <p className="text-sm" style={{ color: colors.text.secondary }}>
                  This is a sample card showing how content looks with the current theme.
                </p>
              </div>

              <div
                className="p-4 rounded-lg shadow-sm"
                style={{ backgroundColor: colors.surface, borderColor: colors.borders }}
              >
                <h4 className="font-semibold mb-2" style={{ color: colors.text.primary }}>
                  Another Card
                </h4>
                <p className="text-sm" style={{ color: colors.text.secondary }}>
                  Cards maintain consistent styling across the application.
                </p>
              </div>

              <div
                className="p-4 rounded-lg shadow-sm"
                style={{ backgroundColor: colors.surface, borderColor: colors.borders }}
              >
                <h4 className="font-semibold mb-2" style={{ color: colors.text.primary }}>
                  Third Card
                </h4>
                <p className="text-sm" style={{ color: colors.text.secondary }}>
                  Theme colors adapt seamlessly to different verticals.
                </p>
              </div>
            </div>
          </div>

          {/* Status Alerts */}
          <div>
            <p className="text-sm font-medium mb-2" style={{ color: colors.text.primary }}>Status Alerts</p>
            <div className="space-y-3">
              <div
                className="flex items-center space-x-3 p-3 rounded-lg"
                style={{ backgroundColor: `${colors.status.success}20`, borderLeft: `4px solid ${colors.status.success}` }}
              >
                <Check className="h-5 w-5" style={{ color: colors.status.success }} />
                <span style={{ color: colors.text.primary }}>Success: Operation completed successfully</span>
              </div>

              <div
                className="flex items-center space-x-3 p-3 rounded-lg"
                style={{ backgroundColor: `${colors.status.warning}20`, borderLeft: `4px solid ${colors.status.warning}` }}
              >
                <AlertTriangle className="h-5 w-5" style={{ color: colors.status.warning }} />
                <span style={{ color: colors.text.primary }}>Warning: Please review the following information</span>
              </div>

              <div
                className="flex items-center space-x-3 p-3 rounded-lg"
                style={{ backgroundColor: `${colors.status.error}20`, borderLeft: `4px solid ${colors.status.error}` }}
              >
                <X className="h-5 w-5" style={{ color: colors.status.error }} />
                <span style={{ color: colors.text.primary }}>Error: An error occurred during processing</span>
              </div>

              <div
                className="flex items-center space-x-3 p-3 rounded-lg"
                style={{ backgroundColor: `${colors.status.info}20`, borderLeft: `4px solid ${colors.status.info}` }}
              >
                <Info className="h-5 w-5" style={{ color: colors.status.info }} />
                <span style={{ color: colors.text.primary }}>Info: Here is some important information</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ThemePreview
