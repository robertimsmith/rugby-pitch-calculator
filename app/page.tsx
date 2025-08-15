"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Rugby pitch dimensions (in meters)
const PITCH_LENGTH = 100 // Length of playing area
const PITCH_WIDTH = 70 // Width of pitch
const GOAL_POST_WIDTH = 5.6 // Width between goal posts
const IN_GOAL_DEPTH = 10 // Depth of in-goal area

// Scale factor for display
const SCALE = 4

interface Point {
  x: number
  y: number
}

interface CalculationResult {
  distanceToNearestGoal: number
  angleWidth: number
  selectedPoint: Point
  nearestGoal: "top" | "bottom"
}

export default function RugbyPitchApp() {
  const [calculation, setCalculation] = useState<CalculationResult | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  // Convert SVG coordinates to pitch coordinates (meters)
  const svgToPitch = useCallback((svgX: number, svgY: number): Point => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }

    const relativeX = svgX - rect.left
    const relativeY = svgY - rect.top

    // Convert to pitch coordinates
    const pitchX = relativeX / SCALE - PITCH_WIDTH / 2
    const pitchY = relativeY / SCALE - IN_GOAL_DEPTH

    return { x: pitchX, y: pitchY }
  }, [])

  // Calculate distance between two points
  const calculateDistance = (p1: Point, p2: Point): number => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
  }

  // Calculate angle width of goal posts from a point
  const calculateAngleWidth = (point: Point, goalY: number): number => {
    const leftPost = { x: -GOAL_POST_WIDTH / 2, y: goalY }
    const rightPost = { x: GOAL_POST_WIDTH / 2, y: goalY }

    // Calculate vectors from point to each post
    const vectorLeft = { x: leftPost.x - point.x, y: leftPost.y - point.y }
    const vectorRight = { x: rightPost.x - point.x, y: rightPost.y - point.y }

    // Calculate angle between vectors
    const dotProduct = vectorLeft.x * vectorRight.x + vectorLeft.y * vectorRight.y
    const magnitudeLeft = Math.sqrt(vectorLeft.x * vectorLeft.x + vectorLeft.y * vectorLeft.y)
    const magnitudeRight = Math.sqrt(vectorRight.x * vectorRight.x + vectorRight.y * vectorRight.y)

    const cosAngle = dotProduct / (magnitudeLeft * magnitudeRight)
    const angleRadians = Math.acos(Math.max(-1, Math.min(1, cosAngle)))

    return angleRadians * (180 / Math.PI) // Convert to degrees
  }

  const handlePitchClick = (event: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return

    const relativeX = event.clientX - rect.left
    const relativeY = event.clientY - rect.top

    const pitchPoint = {
      x: relativeX / SCALE - PITCH_WIDTH / 2,
      y: relativeY / SCALE - IN_GOAL_DEPTH,
    }

    // Goal post positions
    const topGoalY = PITCH_LENGTH
    const bottomGoalY = 0

    // Calculate distances to both goals
    const distanceToTop = calculateDistance(pitchPoint, { x: 0, y: topGoalY })
    const distanceToBottom = calculateDistance(pitchPoint, { x: 0, y: bottomGoalY })

    // Determine nearest goal
    const nearestGoal = distanceToTop < distanceToBottom ? "top" : "bottom"
    const nearestGoalY = nearestGoal === "top" ? topGoalY : bottomGoalY
    const distanceToNearestGoal = Math.min(distanceToTop, distanceToBottom)

    // Calculate angle width for nearest goal
    const angleWidth = calculateAngleWidth(pitchPoint, nearestGoalY)

    setCalculation({
      distanceToNearestGoal,
      angleWidth,
      selectedPoint: pitchPoint,
      nearestGoal,
    })
  }

  // Convert pitch coordinates back to SVG coordinates for display
  const pitchToSvg = (pitchPoint: Point): Point => {
    return {
      x: (pitchPoint.x + PITCH_WIDTH / 2) * SCALE,
      y: (pitchPoint.y + IN_GOAL_DEPTH) * SCALE,
    }
  }

  const svgWidth = PITCH_WIDTH * SCALE
  const svgHeight = (PITCH_LENGTH + 2 * IN_GOAL_DEPTH) * SCALE

  return (
    <div className="min-h-screen bg-green-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-green-800 mb-2">Rugby Pitch Calculator</h1>
          <p className="text-green-600">
            Click anywhere on the pitch to calculate distance and angle to the nearest goal posts
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Rugby Pitch */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-green-700">Rugby Pitch (Top-Down View)</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <svg
                  ref={svgRef}
                  width={svgWidth}
                  height={svgHeight}
                  className="border border-green-300 cursor-crosshair bg-green-100"
                  onClick={handlePitchClick}
                >
                  {/* In-goal areas */}
                  <rect
                    x="0"
                    y="0"
                    width={svgWidth}
                    height={IN_GOAL_DEPTH * SCALE}
                    fill="#90EE90"
                    stroke="#228B22"
                    strokeWidth="2"
                  />
                  <rect
                    x="0"
                    y={(PITCH_LENGTH + IN_GOAL_DEPTH) * SCALE}
                    width={svgWidth}
                    height={IN_GOAL_DEPTH * SCALE}
                    fill="#90EE90"
                    stroke="#228B22"
                    strokeWidth="2"
                  />

                  {/* Main pitch */}
                  <rect
                    x="0"
                    y={IN_GOAL_DEPTH * SCALE}
                    width={svgWidth}
                    height={PITCH_LENGTH * SCALE}
                    fill="#32CD32"
                    stroke="#228B22"
                    strokeWidth="2"
                  />

                  {/* Goal lines */}
                  <line
                    x1="0"
                    y1={IN_GOAL_DEPTH * SCALE}
                    x2={svgWidth}
                    y2={IN_GOAL_DEPTH * SCALE}
                    stroke="#FFFFFF"
                    strokeWidth="3"
                  />
                  <line
                    x1="0"
                    y1={(PITCH_LENGTH + IN_GOAL_DEPTH) * SCALE}
                    x2={svgWidth}
                    y2={(PITCH_LENGTH + IN_GOAL_DEPTH) * SCALE}
                    stroke="#FFFFFF"
                    strokeWidth="3"
                  />

                  {/* Halfway line */}
                  <line
                    x1="0"
                    y1={(PITCH_LENGTH / 2 + IN_GOAL_DEPTH) * SCALE}
                    x2={svgWidth}
                    y2={(PITCH_LENGTH / 2 + IN_GOAL_DEPTH) * SCALE}
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />

                  {/* 22-meter lines */}
                  <line
                    x1="0"
                    y1={(22 + IN_GOAL_DEPTH) * SCALE}
                    x2={svgWidth}
                    y2={(22 + IN_GOAL_DEPTH) * SCALE}
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />
                  <line
                    x1="0"
                    y1={(PITCH_LENGTH - 22 + IN_GOAL_DEPTH) * SCALE}
                    x2={svgWidth}
                    y2={(PITCH_LENGTH - 22 + IN_GOAL_DEPTH) * SCALE}
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />

                  {/* Goal posts */}
                  <rect
                    x={(PITCH_WIDTH / 2 - GOAL_POST_WIDTH / 2) * SCALE}
                    y={IN_GOAL_DEPTH * SCALE - 2}
                    width={GOAL_POST_WIDTH * SCALE}
                    height="4"
                    fill="#8B4513"
                  />
                  <rect
                    x={(PITCH_WIDTH / 2 - GOAL_POST_WIDTH / 2) * SCALE}
                    y={(PITCH_LENGTH + IN_GOAL_DEPTH) * SCALE - 2}
                    width={GOAL_POST_WIDTH * SCALE}
                    height="4"
                    fill="#8B4513"
                  />

                  {/* Selected point */}
                  {calculation && (
                    <circle
                      cx={pitchToSvg(calculation.selectedPoint).x}
                      cy={pitchToSvg(calculation.selectedPoint).y}
                      r="6"
                      fill="#FF4444"
                      stroke="#FFFFFF"
                      strokeWidth="2"
                    />
                  )}
                </svg>
              </CardContent>
            </Card>
          </div>

          {/* Calculations */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-green-700">Calculations</CardTitle>
              </CardHeader>
              <CardContent>
                {calculation ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-green-800 mb-2">Selected Point</h3>
                      <p className="text-sm text-gray-600">
                        X: {calculation.selectedPoint.x.toFixed(1)}m<br />
                        Y: {calculation.selectedPoint.y.toFixed(1)}m
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-green-800 mb-2">Nearest Goal</h3>
                      <p className="text-sm text-gray-600">
                        {calculation.nearestGoal === "top" ? "Top goal posts" : "Bottom goal posts"}
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-green-800 mb-2">Distance to Goal</h3>
                      <p className="text-2xl font-bold text-green-600">
                        {calculation.distanceToNearestGoal.toFixed(1)}m
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-green-800 mb-2">Goal Post Angle</h3>
                      <p className="text-2xl font-bold text-blue-600">{calculation.angleWidth.toFixed(1)}°</p>
                      <p className="text-xs text-gray-500 mt-1">Wider angles make easier kicks</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">Click on the pitch to see calculations</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-green-700 text-sm">Legend</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-100 border border-green-300"></div>
                  <span>In-goal areas</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-400"></div>
                  <span>Playing field</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-2 bg-yellow-700"></div>
                  <span>Goal posts</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-400 rounded-full"></div>
                  <span>Selected point</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
