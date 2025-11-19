'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'

interface AudioPlayerProps {
  open: boolean
  onClose: () => void
  audioUrl: string
  title?: string
  transcript?: string | null
}

export function AudioPlayer({ open, onClose, audioUrl, title, transcript }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Update current time
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)
    const handleEnded = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  // Play/Pause
  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  // Seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return

    const time = parseFloat(e.target.value)
    audio.currentTime = time
    setCurrentTime(time)
  }

  // Skip forward/backward
  const skip = (seconds: number) => {
    const audio = audioRef.current
    if (!audio) return

    audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + seconds))
  }

  // Change playback speed
  const changeSpeed = (rate: number) => {
    const audio = audioRef.current
    if (!audio) return

    audio.playbackRate = rate
    setPlaybackRate(rate)
  }

  // Download audio
  const downloadAudio = () => {
    const link = document.createElement('a')
    link.href = audioUrl
    link.download = `${title || 'voice-note'}.webm`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Format time (MM:SS)
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '00:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Reset on close
  const handleClose = () => {
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
    setIsPlaying(false)
    setCurrentTime(0)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{title || '語音筆記'}</DialogTitle>
          <DialogDescription>音頻播放器</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Hidden audio element */}
          <audio ref={audioRef} src={audioUrl} preload="metadata" />

          {/* Waveform placeholder (could be enhanced with canvas) */}
          <div className="relative h-20 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
            {/* Progress overlay */}
            <div
              className="absolute left-0 top-0 h-full bg-blue-100 transition-all"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
            {/* Time display */}
            <div className="relative z-10 text-sm text-gray-600 font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(59, 130, 246) ${
                  (currentTime / duration) * 100
                }%, rgb(229, 231, 235) ${(currentTime / duration) * 100}%, rgb(229, 231, 235) 100%)`,
              }}
            />
          </div>

          {/* Playback controls */}
          <div className="flex items-center justify-center gap-4">
            {/* Skip backward */}
            <Button variant="outline" size="sm" onClick={() => skip(-10)}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
                <path d="M10.89 16h-.85v-3.26l-1.01.31v-.69l1.77-.63h.09V16z" />
              </svg>
              <span className="ml-1 text-xs">10s</span>
            </Button>

            {/* Play/Pause */}
            <Button
              onClick={togglePlayPause}
              size="lg"
              className="w-14 h-14 rounded-full"
            >
              {isPlaying ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </Button>

            {/* Skip forward */}
            <Button variant="outline" size="sm" onClick={() => skip(10)}>
              <span className="mr-1 text-xs">10s</span>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z" />
                <path d="M13.89 16h-.85v-3.26l-1.01.31v-.69l1.77-.63h.09V16z" />
              </svg>
            </Button>
          </div>

          {/* Playback speed and download */}
          <div className="flex items-center justify-between">
            {/* Playback speed */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">速度:</span>
              <div className="flex gap-1">
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => changeSpeed(rate)}
                    className={`px-2 py-1 text-xs rounded ${
                      playbackRate === rate
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>

            {/* Download button */}
            <Button variant="outline" size="sm" onClick={downloadAudio}>
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              下載
            </Button>
          </div>

          {/* Transcript (if available) */}
          {transcript && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">轉錄文字</span>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 max-h-48 overflow-y-auto">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{transcript}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={handleClose}>
            關閉
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
