"use client";

import Lottie from "lottie-react";
import { useEffect, useState } from "react";

// AI Brain animation - a nice animated brain/thinking visualization
const brainAnimation = {
  v: "5.5.7",
  fr: 60,
  ip: 0,
  op: 120,
  w: 400,
  h: 400,
  nm: "AI Brain",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Particles",
      sr: 1,
      ks: {
        o: { a: 0, k: 80 },
        r: { a: 1, k: [{ t: 0, s: [0], e: [360] }, { t: 120, s: [360] }] },
        p: { a: 0, k: [200, 200, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      ao: 0,
      shapes: [
        {
          ty: "gr",
          it: [
            { ty: "el", s: { a: 0, k: [8, 8] }, p: { a: 0, k: [0, -80] } },
            { ty: "fl", c: { a: 0, k: [0.4, 0.6, 1, 1] }, o: { a: 0, k: 100 } },
            { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
        {
          ty: "gr",
          it: [
            { ty: "el", s: { a: 0, k: [6, 6] }, p: { a: 0, k: [70, -40] } },
            { ty: "fl", c: { a: 0, k: [0.6, 0.4, 1, 1] }, o: { a: 0, k: 100 } },
            { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
        {
          ty: "gr",
          it: [
            { ty: "el", s: { a: 0, k: [10, 10] }, p: { a: 0, k: [80, 20] } },
            { ty: "fl", c: { a: 0, k: [0.3, 0.5, 1, 1] }, o: { a: 0, k: 100 } },
            { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
        {
          ty: "gr",
          it: [
            { ty: "el", s: { a: 0, k: [7, 7] }, p: { a: 0, k: [50, 65] } },
            { ty: "fl", c: { a: 0, k: [0.5, 0.3, 0.9, 1] }, o: { a: 0, k: 100 } },
            { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
        {
          ty: "gr",
          it: [
            { ty: "el", s: { a: 0, k: [5, 5] }, p: { a: 0, k: [-60, 50] } },
            { ty: "fl", c: { a: 0, k: [0.7, 0.5, 1, 1] }, o: { a: 0, k: 100 } },
            { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
        {
          ty: "gr",
          it: [
            { ty: "el", s: { a: 0, k: [9, 9] }, p: { a: 0, k: [-75, -20] } },
            { ty: "fl", c: { a: 0, k: [0.4, 0.4, 1, 1] }, o: { a: 0, k: 100 } },
            { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
      ],
    },
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: "Outer Ring",
      sr: 1,
      ks: {
        o: { a: 0, k: 60 },
        r: { a: 1, k: [{ t: 0, s: [0], e: [-360] }, { t: 120, s: [-360] }] },
        p: { a: 0, k: [200, 200, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      ao: 0,
      shapes: [
        {
          ty: "gr",
          it: [
            { ty: "el", s: { a: 0, k: [180, 180] }, p: { a: 0, k: [0, 0] } },
            { ty: "st", c: { a: 0, k: [0.4, 0.5, 1, 1] }, o: { a: 0, k: 100 }, w: { a: 0, k: 2 }, lc: 2, lj: 1, d: [{ n: "d", nm: "dash", v: { a: 0, k: 8 } }, { n: "g", nm: "gap", v: { a: 0, k: 12 } }] },
            { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
      ],
    },
    {
      ddd: 0,
      ind: 3,
      ty: 4,
      nm: "Middle Ring",
      sr: 1,
      ks: {
        o: { a: 0, k: 80 },
        r: { a: 1, k: [{ t: 0, s: [0], e: [360] }, { t: 120, s: [360] }] },
        p: { a: 0, k: [200, 200, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      ao: 0,
      shapes: [
        {
          ty: "gr",
          it: [
            { ty: "el", s: { a: 0, k: [130, 130] }, p: { a: 0, k: [0, 0] } },
            { ty: "st", c: { a: 0, k: [0.5, 0.4, 0.9, 1] }, o: { a: 0, k: 100 }, w: { a: 0, k: 3 }, lc: 2, lj: 1, d: [{ n: "d", nm: "dash", v: { a: 0, k: 20 } }, { n: "g", nm: "gap", v: { a: 0, k: 15 } }] },
            { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
      ],
    },
    {
      ddd: 0,
      ind: 4,
      ty: 4,
      nm: "Inner Ring",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 1, k: [{ t: 0, s: [0], e: [-360] }, { t: 120, s: [-360] }] },
        p: { a: 0, k: [200, 200, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      ao: 0,
      shapes: [
        {
          ty: "gr",
          it: [
            { ty: "el", s: { a: 0, k: [80, 80] }, p: { a: 0, k: [0, 0] } },
            { ty: "st", c: { a: 0, k: [0.6, 0.5, 1, 1] }, o: { a: 0, k: 100 }, w: { a: 0, k: 4 }, lc: 2, lj: 1, d: [{ n: "d", nm: "dash", v: { a: 0, k: 30 } }, { n: "g", nm: "gap", v: { a: 0, k: 20 } }] },
            { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
      ],
    },
    {
      ddd: 0,
      ind: 5,
      ty: 4,
      nm: "Core",
      sr: 1,
      ks: {
        o: { a: 1, k: [{ t: 0, s: [100], e: [60] }, { t: 30, s: [60], e: [100] }, { t: 60, s: [100], e: [60] }, { t: 90, s: [60], e: [100] }, { t: 120, s: [100] }] },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [200, 200, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 1, k: [{ t: 0, s: [100, 100, 100], e: [115, 115, 100] }, { t: 30, s: [115, 115, 100], e: [100, 100, 100] }, { t: 60, s: [100, 100, 100], e: [115, 115, 100] }, { t: 90, s: [115, 115, 100], e: [100, 100, 100] }, { t: 120, s: [100, 100, 100] }] },
      },
      ao: 0,
      shapes: [
        {
          ty: "gr",
          it: [
            { ty: "el", s: { a: 0, k: [40, 40] }, p: { a: 0, k: [0, 0] } },
            { ty: "gf", o: { a: 0, k: 100 }, r: 1, g: { p: 3, k: { a: 0, k: [0, 0.4, 0.4, 1, 0.5, 0.5, 0.35, 0.95, 1, 0.6, 0.3, 0.9] } }, s: { a: 0, k: [0, 0] }, e: { a: 0, k: [20, 20] }, t: 2 },
            { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
      ],
    },
  ],
};

const analysisSteps = [
  { label: "Marketing & SEO", icon: "📊" },
  { label: "Tech Stack Detection", icon: "⚙️" },
  { label: "Site Architecture", icon: "🏗️" },
  { label: "Performance Analysis", icon: "⚡" },
  { label: "Generating Recommendations", icon: "💡" },
];

interface AnalysisModalProps {
  isOpen: boolean;
}

export function AnalysisModal({ isOpen }: AnalysisModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [dots, setDots] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      return;
    }

    // Cycle through steps
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % analysisSteps.length);
    }, 4000);

    // Animate dots
    const dotInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 400);

    return () => {
      clearInterval(stepInterval);
      clearInterval(dotInterval);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      {/* Modal */}
      <div className="relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-800">
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-xl -z-10" />

        {/* Lottie Animation */}
        <div className="flex justify-center mb-4">
          <div className="w-48 h-48 relative">
            <Lottie
              animationData={brainAnimation}
              loop={true}
              style={{ width: "100%", height: "100%" }}
            />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center mb-2">
          <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            AI Analysis in Progress
          </span>
        </h2>

        {/* Subtitle */}
        <p className="text-center text-muted-foreground mb-6">
          Analyzing your website with GPT-4{dots}
        </p>

        {/* Progress Steps */}
        <div className="space-y-2">
          {analysisSteps.map((step, index) => (
            <div
              key={step.label}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-500 ${
                index === currentStep
                  ? "bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-purple-300/50 dark:border-purple-700/50 shadow-lg shadow-purple-500/10"
                  : index < currentStep
                  ? "opacity-60"
                  : "opacity-40"
              }`}
            >
              <span className={`text-xl transition-transform duration-300 ${index === currentStep ? "scale-125" : ""}`}>
                {step.icon}
              </span>
              <span
                className={`font-medium flex-1 ${
                  index === currentStep
                    ? "text-purple-700 dark:text-purple-300"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {step.label}
              </span>
              {index === currentStep && (
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              )}
              {index < currentStep && (
                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
          <p className="text-center text-xs text-muted-foreground">
            Running 5 AI analyses in parallel. This takes about 30-60 seconds.
          </p>
        </div>
      </div>
    </div>
  );
}
